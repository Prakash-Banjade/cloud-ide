import { z } from 'zod';
import { BaseMessage } from '@langchain/core/messages';

// File schema
export const FileSchema = z.object({
    path: z.string().describe('The path to the file to be created or modified'),
    purpose: z.string().describe("The purpose of the file, e.g. 'main application logic', 'data processing module', etc."),
});

export type File = z.infer<typeof FileSchema>;

// Plan schema
export const PlanSchema = z.object({
    name: z.string().describe('The name of app to be built'),
    description: z.string().describe("A oneline description of the app to be built, e.g. 'A web application for managing personal finances'"),
    techstack: z.string().describe("The tech stack to be used for the app, e.g. 'python', 'javascript', 'react', 'flask', etc."),
    features: z.array(z.string()).describe("A list of features that the app should have, e.g. 'user authentication', 'data visualization', etc."),
    files: z.array(FileSchema).describe("A list of files to be created, each with a 'path' and 'purpose'"),
});

export type Plan = z.infer<typeof PlanSchema>;

// Implementation Task schema
export const ImplementationTaskSchema = z.object({
    filepath: z.string().describe('The path to the file to be modified'),
    task_description: z.string().describe("A detailed description of the task to be performed on the file, e.g. 'add user authentication', 'implement data processing logic', etc."),
});

export type ImplementationTask = z.infer<typeof ImplementationTaskSchema>;

// Task Plan schema
export const TaskPlanSchema = z.object({
    implementation_steps: z.array(ImplementationTaskSchema).describe('A list of steps to be taken to implement the task'),
    plan: PlanSchema.nullable().describe('The plan for the task'),
});

export type TaskPlan = z.infer<typeof TaskPlanSchema>;

// Coder State
export interface CoderState {
    task_plan: TaskPlan;
    current_step_idx: number;
    current_file_content?: string;
}

// Graph State
export interface GraphState {
    user_prompt?: string;
    messages?: BaseMessage[];
    stack_context?: StackContext;
    plan?: Plan;
    task_plan?: TaskPlan;
    coder_state?: CoderState;
    status?: string;
    route?: 'agent' | 'direct';
    direct_response?: string;
}

export type StackContext = {
    language: string;
    framework: string;
    projectType: string;
    rules: string[];
};