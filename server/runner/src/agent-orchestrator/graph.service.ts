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
}