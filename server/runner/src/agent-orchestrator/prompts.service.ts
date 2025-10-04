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
            `.trim()
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
            `.trim()
        )
    }

    routerPrompt(userPrompt: string): string {
        return `
            Analyze the user prompt and determine if it requires a multi-agent project generation system or can be answered directly.

            Route to "agent" if the prompt:
            - Asks to build, create, develop, or generate a project/application/tool/website
            - Requests code implementation, file creation, or software development
            - Describes features, requirements, or technical specifications for a system
            - Contains words like: "build", "create", "develop", "make", "implement", "generate", "app", "website", "tool", "project", "system"

            Route to "direct" if the prompt:
            - Is a casual conversation, greeting, or small talk
            - Asks a general question that doesn't require code generation
            - Requests explanation, definition, or information
            - Is a simple query that can be answered in one response

            User Prompt: "${userPrompt}"

            Respond with ONLY "agent" or "direct" - nothing else.
        `.trim();
    }
}