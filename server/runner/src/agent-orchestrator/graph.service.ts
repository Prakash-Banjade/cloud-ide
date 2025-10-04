import { Injectable, OnModuleInit } from '@nestjs/common';
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { CoderState, GraphState, Plan, TaskPlan } from './types';
import { PlannerAgent } from './agents/planner-agent.service';
import { ArchitectAgent } from './agents/architech-agent.service';
import { CoderAgent } from './agents/coder-agent.service';

@Injectable()
export class GraphService implements OnModuleInit {
    private compiledGraph: any;

    constructor(
        private plannerAgent: PlannerAgent,
        private architectAgent: ArchitectAgent,
        private coderAgent: CoderAgent,
    ) { }

    async onModuleInit() {
        this.compiledGraph = this.createGraph();
    }

    private createGraph() {
        const stateAnnotation = Annotation.Root({
            user_prompt: Annotation<string>,
            plan: Annotation<Plan>,
            task_plan: Annotation<TaskPlan>,
            coder_state: Annotation<CoderState>,
            status: Annotation<string>,
        });

        // Add nodes
        const graph = new StateGraph(stateAnnotation)
            .addNode('planner', async (state: GraphState) => {
                return await this.plannerAgent.execute(state);
            })
            .addNode('architect', async (state: GraphState) => {
                return await this.architectAgent.execute(state);
            })
            .addNode('coder', async (state: GraphState) => {
                return await this.coderAgent.execute(state);
            })
            .addEdge("__start__", "planner")
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
            )
            .addEdge("coder", "__end__");

        return graph.compile();
    }

    async invoke(input: { user_prompt: string }, config?: any) {
        const defaultConfig = {
            recursionLimit: 100,
            ...config,
        };

        console.log('\n🚀 Starting Agent Graph Execution');
        console.log(`📝 User Prompt: ${input.user_prompt}\n`);

        const result = await this.compiledGraph.invoke(input, defaultConfig);

        console.log('\n🎉 Agent Graph Execution Complete!');

        return result;
    }
}