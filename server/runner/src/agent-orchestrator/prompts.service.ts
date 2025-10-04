export class PromptService {
    constructor() { }

    plannerPrompt(userPrompt: string) {
        return (
            "You are the PLANNER agent. Convert the user prompt into a COMPLETE engineering project plan.\n" +
            "User prompt:\n" +
            userPrompt
        )
    }

    architectPrompt(plan: string) {
        return (
            `
                You are the ARCHITECT agent. Given this project plan, break it down into explicit engineering tasks.

                RULES:
                - For each FILE in the plan, create one or more IMPLEMENTATION TASKS.
                - In each task description:
                    * Specify exactly what to implement.
                    * Name the variables, functions, classes, and components to be defined.
                    * Mention how this task depends on or will be used by previous tasks.
                    * Include integration details: imports, expected function signatures, data flow.
                - Order tasks so that dependencies are implemented first.
                - Each step must be SELF-CONTAINED but also carry FORWARD the relevant context from earlier tasks.

                Project Plan:
                ${plan}
            `
        )
    }

    codingPrompt() {
        return (
            `
                You are the CODER agent.
                You are implementing a specific engineering task.
                You have access to tools to read and write files.

                Always:
                - Review all existing files to maintain compatibility.
                - Implement the FULL file content, integrating with other modules.
                - Maintain consistent naming of variables, functions, and imports.
                - When a module is imported from another file, ensure it exists and is implemented as described.
            `
        )
    }
}