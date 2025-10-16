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

    private createStreamEvent(type: StreamEventType, agent?: string, data?: any, message?: string): StreamEvent {
        return {
            type,
            agent,
            data,
            message,
            timestamp: new Date().toISOString(),
        };
    }

/*************  ✨ Windsurf Command ⭐  *************/
    /**

/*******  9208ebce-da7d-4b47-95db-a4cea37d53c0  *******/
    private routerDecisionMessage(route?: string, reason?: string) {
        if (!route) return undefined;
        const base = route === 'direct'
            ? 'Router chose a direct reply for this request.'
            : 'Router escalated to the full multi-agent workflow.';
        return reason ? `${base} Reason: ${reason}` : base;
    }

    private agentStartMessage(agent?: string) {
        switch (agent) {
            case 'router':
                return 'Router is analyzing your request to determine the best path.';
            case 'direct':
                return 'Direct agent is composing a reply based on your request.';
            default:
                return undefined;
        }
    }

    private plannerMessage(plan?: any) {
        if (!plan) return undefined;
        const files = Array.isArray(plan.files) ? plan.files.length : 0;
        const techstack = plan.techstack ? ` using ${plan.techstack}` : '';
        return `Planner created “${plan.name ?? 'the project plan'}”${techstack} covering ${files} file${files === 1 ? '' : 's'}.`;
    }

    private architectMessage(taskPlan?: any) {
        if (!taskPlan?.implementation_steps) return undefined;
        const total = taskPlan.implementation_steps.length;
        if (total === 0) {
            return 'Architect reviewed the plan with no implementation steps required.';
        }
        const firstTask = taskPlan.implementation_steps[0];
        const preview = firstTask?.filepath ? ` First focus: ${firstTask.filepath}.` : '';
        return `Architect outlined ${total} implementation step${total === 1 ? '' : 's'}.${preview}`;
    }

    private coderProgressMessage(coderState?: any, status?: string) {
        if (!coderState?.task_plan?.implementation_steps) return undefined;
        const steps = coderState.task_plan.implementation_steps;
        const totalSteps = steps.length;
        const currentStep = coderState.current_step_idx;

        if (status === 'DONE') {
            return `Coder wrapped up all ${totalSteps} implementation step${totalSteps === 1 ? '' : 's'}.`;
        }

        if (currentStep > 0 && currentStep <= totalSteps) {
            const task = steps[currentStep - 1];
            const filepath = task?.filepath ? ` (${task.filepath})` : '';
            return `Coder finished step ${currentStep}/${totalSteps}${filepath}.`;
        }

        if (currentStep === 0 && steps[0]) {
            const first = steps[0];
            return `Coder is preparing to start with ${first.filepath ?? 'the first task'}.`;
        }

        return undefined;
    }

    private chunkMessage(message: string, chunkSize = 200): string[] {
        if (!message) return [];

        const chunks: string[] = [];
        let remaining = message.trim();

        while (remaining.length > 0) {
            if (remaining.length <= chunkSize) {
                chunks.push(remaining);
                break;
            }

            let boundary = remaining.lastIndexOf('\n', chunkSize);
            if (boundary <= 0) {
                boundary = remaining.lastIndexOf(' ', chunkSize);
            }

            if (boundary <= 0) {
                boundary = chunkSize;
            }

            const chunk = remaining.slice(0, boundary).trimEnd();
            chunks.push(chunk);
            remaining = remaining.slice(boundary).trimStart();
        }

        return chunks;
    }

    private buildCompletionSummary(state: Partial<GraphState>): string {
        const plan = state.plan ?? state.task_plan?.plan;
        const implementationSteps = state.task_plan?.implementation_steps
            ?? state.coder_state?.task_plan?.implementation_steps
            ?? [];
        const completedSteps = Math.max(
            Math.min(state.coder_state?.current_step_idx ?? implementationSteps.length, implementationSteps.length),
            implementationSteps.length ? 1 : 0,
        );

        const maxTasksToShow = 8;
        const completedTasks = implementationSteps.slice(0, Math.min(completedSteps, maxTasksToShow));

        const title = plan?.name?.trim();
        const techstack = plan?.techstack?.trim();
        const description = plan?.description?.trim();

        const introParts: string[] = [];
        if (title) {
            introParts.push(`I’ve finished building ${title}${techstack ? ` using ${techstack}` : ''}.`);
        } else {
            introParts.push(`I’ve wrapped up the work on your request${techstack ? ` using ${techstack}` : ''}.`);
        }

        if (description) {
            introParts.push(description);
        }

        const summaryLines: string[] = [introParts.join(' ')];

        if (completedTasks.length > 0) {
            summaryLines.push('\nHere’s what was implemented:');
            completedTasks.forEach(task => {
                const filepath = task.filepath ?? 'project file';
                const detail = task.task_description?.trim() ?? '';
                summaryLines.push(`- ${filepath}${detail ? ` — ${detail}` : ''}`);
            });
            if (completedSteps > completedTasks.length) {
                summaryLines.push(`- …and ${completedSteps - completedTasks.length} more update${completedSteps - completedTasks.length === 1 ? '' : 's'}.`);
            }
        }

        const primaryFile = completedTasks[0]?.filepath ?? implementationSteps[0]?.filepath;
        if (primaryFile) {
            summaryLines.push(`\nYou can start by opening ${primaryFile} to review the results.`);
        }

        if (plan?.features?.length) {
            const highlighted = plan.features.slice(0, 3);
            summaryLines.push(`\nKey features covered: ${highlighted.join(', ')}${plan.features.length > 3 ? ', …' : ''}.`);
        }

        if (state.user_prompt) {
            summaryLines.push(`\nLet me know if you’d like to refine anything else about “${state.user_prompt}”.`);
        }

        return summaryLines.join('\n').trim();
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

        try {
            const stream = await this.compiledGraph.stream(input, defaultConfig);
            const finalState: Partial<GraphState> = { user_prompt: input.user_prompt };
            let finalResponseSent = false;

            for await (const chunk of stream) {
                const nodeName = Object.keys(chunk)[0];
                const nodeOutput = chunk[nodeName];

                if (nodeOutput?.plan) {
                    finalState.plan = nodeOutput.plan as Plan;
                }
                if (nodeOutput?.task_plan) {
                    finalState.task_plan = nodeOutput.task_plan as TaskPlan;
                }
                if (nodeOutput?.coder_state) {
                    finalState.coder_state = nodeOutput.coder_state as CoderState;
                }
                if (nodeOutput?.status) {
                    finalState.status = nodeOutput.status as string;
                }
                if (nodeOutput?.route) {
                    finalState.route = nodeOutput.route as 'agent' | 'direct';
                }
                if (nodeOutput?.direct_response) {
                    finalState.direct_response = nodeOutput.direct_response as string;
                }

                const startMessage = this.agentStartMessage(nodeName);
                yield this.createStreamEvent(StreamEventType.AGENT_START, nodeName, undefined, startMessage);

                if (nodeName === 'router' && nodeOutput.route) {
                    yield this.createStreamEvent(
                        StreamEventType.ROUTER_DECISION,
                        'router',
                        { route: nodeOutput.route, reason: nodeOutput.reason },
                        this.routerDecisionMessage(nodeOutput.route as string, nodeOutput.reason as string)
                    );
                }

                if (nodeName === 'direct' && nodeOutput.direct_response) {
                    for (const textChunk of this.chunkMessage(nodeOutput.direct_response as string)) {
                        yield this.createStreamEvent(
                            StreamEventType.DIRECT_RESPONSE_CHUNK,
                            'direct',
                            { chunk: textChunk },
                        );
                    }

                    yield this.createStreamEvent(
                        StreamEventType.DIRECT_RESPONSE_COMPLETE,
                        'direct',
                        { response: nodeOutput.direct_response },
                    );
                    finalResponseSent = true;
                }

                if (nodeName === 'planner' && nodeOutput.plan) {
                    yield this.createStreamEvent(
                        StreamEventType.PLANNER_PLAN_CREATED,
                        'planner',
                        {
                            name: nodeOutput.plan["name"],
                            description: nodeOutput.plan["description"],
                            techstack: nodeOutput.plan["techstack"],
                            fileCount: nodeOutput.plan?.["files"]?.length || 0,
                        },
                        this.plannerMessage(nodeOutput.plan)
                    );
                }

                if (nodeName === 'architect' && nodeOutput.task_plan) {
                    const rawSteps = Array.isArray(nodeOutput.task_plan?.["implementation_steps"])
                        ? nodeOutput.task_plan?.["implementation_steps"]
                        : [];
                    const tasks = rawSteps.map((step: any) => ({
                        filepath: step.filepath,
                        description: step.task_description?.substring(0, 100) + '...',
                    }));

                    yield this.createStreamEvent(
                        StreamEventType.ARCHITECT_TASK_CREATED,
                        'architect',
                        {
                            taskCount: tasks.length,
                            tasks,
                        },
                        this.architectMessage(nodeOutput.task_plan)
                    );
                }

                if (nodeName === 'coder' && nodeOutput.coder_state) {
                    const coderState = nodeOutput.coder_state;
                    const implementationSteps = coderState?.["task_plan"]?.implementation_steps ?? [];
                    const totalSteps = implementationSteps.length;
                    const currentStep = coderState?.["current_step_idx"];

                    if (currentStep > 0 && currentStep <= totalSteps) {
                        const task = implementationSteps[currentStep - 1];
                        yield this.createStreamEvent(
                            StreamEventType.CODER_TASK_COMPLETE,
                            'coder',
                            {
                                currentStep,
                                totalSteps,
                                filepath: task?.filepath,
                            },
                            this.coderProgressMessage(nodeOutput.coder_state, nodeOutput.status as string)
                        );
                    }

                    if (nodeOutput.status === 'DONE') {
                        yield this.createStreamEvent(
                            StreamEventType.CODER_ALL_COMPLETE,
                            'coder',
                            { totalSteps },
                            this.coderProgressMessage(nodeOutput.coder_state, nodeOutput.status)
                        );
                    }
                }

                yield this.createStreamEvent(StreamEventType.AGENT_END, nodeName);
            }

            if (!finalResponseSent) {
                const completionSummary = this.buildCompletionSummary(finalState);

                if (completionSummary) {
                    for (const textChunk of this.chunkMessage(completionSummary)) {
                        yield this.createStreamEvent(
                            StreamEventType.DIRECT_RESPONSE_CHUNK,
                            'orchestrator',
                            { chunk: textChunk },
                        );
                    }

                    yield this.createStreamEvent(
                        StreamEventType.DIRECT_RESPONSE_COMPLETE,
                        'orchestrator',
                        { response: completionSummary },
                    );
                }
            }

            yield this.createStreamEvent(StreamEventType.COMPLETE);
        } catch (error) {
            console.error('❌ Streaming error:', error);
            yield this.createStreamEvent(
                StreamEventType.ERROR,
                undefined,
                { error: error.message },
                `Error: ${error.message}`
            );
        }

        console.log('\n🎉 Streaming Complete!');
    }
}