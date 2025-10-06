import { Injectable, OnModuleInit } from '@nestjs/common';
import { StateGraph, END, Annotation, CompiledStateGraph } from '@langchain/langgraph';
import { CoderState, GraphState, Plan, TaskPlan } from './types';
import { PlannerAgent } from './agents/planner-agent.service';
import { ArchitectAgent } from './agents/architech-agent.service';
import { CoderAgent } from './agents/coder-agent.service';
import { ConfigService } from '@nestjs/config';
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { RouterAgent } from './agents/router-agent.service';
import { DirectAgent } from './agents/direct-agent.service';
import { StreamEvent, StreamEventType } from './types/streaming.types';

@Injectable()
export class GraphService implements OnModuleInit {
    private compiledGraph: CompiledStateGraph<any, any, any>;
    // private checkpointer: PostgresSaver;

    constructor(
        private plannerAgent: PlannerAgent,
        private architectAgent: ArchitectAgent,
        private coderAgent: CoderAgent,
        private routerAgent: RouterAgent,
        private directAgent: DirectAgent,
        private readonly configService: ConfigService
    ) {
        // this.checkpointer = PostgresSaver.fromConnString(this.configService.getOrThrow('DATABASE_URL'));
    }

    async onModuleInit() {
        // need to call checkpointer.setup() the first time you’re using Postgres checkpointer
        // await this.checkpointer.setup();
        this.compiledGraph = this.createGraph();
    }

    private createStreamEvent(type: StreamEventType, agent?: string, data?: any): StreamEvent {
        return {
            type,
            agent,
            data,
            timestamp: new Date().toISOString(),
        };
    }

    private createGraph() {
        const stateAnnotation = Annotation.Root({
            user_prompt: Annotation<string>,
            plan: Annotation<Plan>,
            task_plan: Annotation<TaskPlan>,
            coder_state: Annotation<CoderState>,
            status: Annotation<string>,
            route: Annotation<'agent' | 'direct'>,
            direct_response: Annotation<string>,
        });

        const builder = new StateGraph(stateAnnotation)
            .addNode('router', async (state: GraphState) => {
                return await this.routerAgent.execute(state);
            })
            .addNode('direct', async (state: GraphState) => {
                return await this.directAgent.execute(state);
            })
            .addNode('planner', async (state: GraphState) => {
                return await this.plannerAgent.execute(state);
            })
            .addNode('architect', async (state: GraphState) => {
                return await this.architectAgent.execute(state);
            })
            .addNode('coder', async (state: GraphState) => {
                return await this.coderAgent.execute(state);
            })
            .addEdge("__start__", "router")
            .addConditionalEdges(
                'router',
                (state: GraphState) => {
                    console.log({ state })
                    return state.route === 'direct' ? 'direct' : 'planner';
                },
                {
                    direct: 'direct',
                    planner: 'planner',
                }
            )
            .addEdge('direct', '__end__')
            .addEdge('planner', 'architect')
            .addEdge('architect', 'coder')
            .addConditionalEdges(
                'coder',
                (state: GraphState) => {
                    return state.status === 'DONE' ? 'END' : 'coder';
                },
                {
                    END: END,
                    coder: 'coder',
                }
            );

        return builder.compile({
            // checkpointer: this.checkpointer
        });
    }

    async invoke(input: { user_prompt: string }, config?: any) {
        const defaultConfig = {
            recursionLimit: 100,
            configurable: { thread_id: this.configService.getOrThrow("REPL_ID") },
            ...config,
        };

        console.log('\n🚀 Starting Agent Graph Execution');
        console.log(`📝 User Prompt: ${input.user_prompt}\n`);

        const result = await this.compiledGraph.invoke(input, defaultConfig);

        console.log('\n🎉 Agent Graph Execution Complete!');

        return result;
    }


    /**
     * Stream graph execution with real-time events
     */
    async *stream(input: { user_prompt: string }, config?: any): AsyncGenerator<StreamEvent> {
        // const threadId = config?.thread_id || `thread_${Date.now()}`;

        const defaultConfig = {
            recursionLimit: 100,
            // configurable: { thread_id: threadId },
            streamMode: 'updates' as const,
            ...config,
        };

        console.log('\n🚀 Starting Streaming Agent Graph Execution');
        console.log(`📝 User Prompt: ${input.user_prompt}`);
        // console.log(`🔗 Thread ID: ${threadId}\n`);

        try {
            const stream = await this.compiledGraph.stream(input, defaultConfig);

            for await (const chunk of stream) {
                const nodeName = Object.keys(chunk)[0];
                const nodeOutput = chunk[nodeName];

                yield this.createStreamEvent(StreamEventType.AGENT_START, nodeName);

                if (nodeName === 'router' && nodeOutput.route) {
                    yield this.createStreamEvent(
                        StreamEventType.ROUTER_DECISION,
                        'router',
                        { route: nodeOutput.route }
                    );
                }

                if (nodeName === 'direct' && nodeOutput.direct_response) {
                    yield this.createStreamEvent(
                        StreamEventType.DIRECT_RESPONSE_COMPLETE,
                        'direct',
                        { response: nodeOutput.direct_response }
                    );
                }

                if (nodeName === 'planner' && nodeOutput.plan) {
                    yield this.createStreamEvent(
                        StreamEventType.PLANNER_PLAN_CREATED,
                        'planner',
                        {
                            name: nodeOutput.plan["name"],
                            description: nodeOutput.plan["description"],
                            techstack: nodeOutput.plan["techstack"],
                            fileCount: nodeOutput.plan?.["techstack"]?.length || 0,
                        }
                    );
                }

                if (nodeName === 'architect' && nodeOutput.task_plan) {
                    const tasks = nodeOutput.task_plan?.["implementation_steps"]?.map((step: any) => ({
                        filepath: step.filepath,
                        description: step.task_description.substring(0, 100) + '...',
                    }));

                    yield this.createStreamEvent(
                        StreamEventType.ARCHITECT_TASK_CREATED,
                        'architect',
                        {
                            taskCount: tasks.length,
                            tasks,
                        }
                    );
                }

                if (nodeName === 'coder' && nodeOutput.coder_state) {
                    const coderState = nodeOutput.coder_state;
                    const totalSteps = coderState?.["task_plan"]?.implementation_steps.length;
                    const currentStep = coderState?.["current_step_idx"];

                    if (currentStep > 0 && currentStep <= totalSteps) {
                        const task = coderState?.["task_plan"]?.implementation_steps[currentStep - 1];
                        yield this.createStreamEvent(
                            StreamEventType.CODER_TASK_COMPLETE,
                            'coder',
                            {
                                currentStep,
                                totalSteps,
                                filepath: task.filepath,
                            }
                        );
                    }

                    if (nodeOutput.status === 'DONE') {
                        yield this.createStreamEvent(
                            StreamEventType.CODER_ALL_COMPLETE,
                            'coder',
                            { totalSteps }
                        );
                    }
                }

                yield this.createStreamEvent(StreamEventType.AGENT_END, nodeName);
            }

            yield this.createStreamEvent(StreamEventType.COMPLETE);
        } catch (error) {
            console.error('❌ Streaming error:', error);
            yield this.createStreamEvent(
                StreamEventType.ERROR,
                undefined,
                { error: error.message }
            );
        }

        console.log('\n🎉 Streaming Complete!');
    }
}