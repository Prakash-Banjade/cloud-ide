import { Injectable } from '@nestjs/common';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { McpClientService } from '../mcp-client.service';
import { GraphState, StackContext } from '../types';

@Injectable()
export class TechLeadAgent {
    constructor(private readonly mcpClient: McpClientService) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        let resources: any[] = [];
        try {
            resources = await this.mcpClient.listResources();
        } catch (error) {
            console.warn('TechLead: failed to list resources via MCP', error);
        }

        const workspacePaths = this.extractPaths(resources);
        const hasExistingProject = workspacePaths.length > 0;

        const stackContext = hasExistingProject
            ? await this.detectFromWorkspace(workspacePaths)
            : this.inferFromPrompt(state.user_prompt ?? '');

        return { stack_context: stackContext };
    }

    private extractPaths(resources: any[]): string[] {
        return resources
            .map((resource) => {
                if (typeof resource === 'string') return resource;
                if (resource?.uri) {
                    try {
                        const uri = new URL(resource.uri);
                        return uri.pathname.replace(WORKSPACE_PATH, '').replace(/^\//, '');
                    } catch {
                        return resource.uri;
                    }
                }
                if (resource?.name) return resource.name;
                return '';
            })
            .filter((path) => Boolean(path));
    }

    private async detectFromWorkspace(paths: string[]): Promise<StackContext> {
        const lowerPaths = paths.map((p) => p.toLowerCase());
        const rules = ['Respect the existing repository conventions and directory layout.'];

        if (lowerPaths.some((p) => p.includes('pom.xml'))) {
            rules.push('Preserve Maven module structure.');
            return { language: 'java', framework: 'none', projectType: 'binary', rules };
        }

        if (lowerPaths.some((p) => p.includes('cargo.toml'))) {
            rules.push('Use cargo for builds and dependency management.');
            return { language: 'rust', framework: 'none', projectType: 'binary', rules };
        }

        if (lowerPaths.some((p) => p.includes('pyproject.toml') || p.endsWith('.py'))) {
            rules.push('Keep modules organized with __init__.py where appropriate.');
            return { language: 'python', framework: 'none', projectType: 'script', rules };
        }

        if (lowerPaths.some((p) => p.includes('package.json'))) {
            const pkg = await this.readPackageJson();
            const deps = Object.keys(pkg);

            if (deps.some((dep) => dep.startsWith('next'))) {
                rules.push('STRICT: Use App Router (app/) with layout.tsx and route.ts files.');
                return { language: 'typescript', framework: 'nextjs', projectType: 'app-router', rules };
            }

            if (deps.some((dep) => dep === 'react' || dep === 'react-dom')) {
                rules.push('Place React components in a components/ directory and pages under pages/.');
                return { language: 'typescript', framework: 'react', projectType: 'pages-router', rules };
            }
        }

        if (lowerPaths.some((p) => p.startsWith('app/') || p.includes('next.config'))) {
            rules.push('STRICT: Use App Router (app/) with layout.tsx and server components by default.');
            return { language: 'typescript', framework: 'nextjs', projectType: 'app-router', rules };
        }

        if (lowerPaths.some((p) => p.startsWith('pages/'))) {
            rules.push('Follow the Next.js pages router conventions.');
            return { language: 'typescript', framework: 'nextjs', projectType: 'pages-router', rules };
        }

        if (lowerPaths.some((p) => p.includes('vite.config'))) {
            rules.push('Keep Vite entrypoints consistent (main.tsx, index.html).');
            return { language: 'typescript', framework: 'react', projectType: 'pages-router', rules };
        }

        return {
            language: 'typescript',
            framework: 'none',
            projectType: 'script',
            rules,
        };
    }

    private inferFromPrompt(prompt: string): StackContext {
        const normalized = prompt.toLowerCase();
        const rules = ['Align the stack choice with the user intent.'];

        if (normalized.includes('vue')) {
            rules.push('Use Vue single-file components and vue-router for navigation.');
            return { language: 'typescript', framework: 'vue', projectType: 'pages-router', rules };
        }

        if (normalized.includes('saas') || normalized.includes('dashboard')) {
            rules.push('Use Tailwind CSS for rapid UI delivery.');
            rules.push('Use the Next.js App Router (app/).');
            return { language: 'typescript', framework: 'nextjs', projectType: 'app-router', rules };
        }

        if (normalized.includes('data') && normalized.includes('analysis')) {
            rules.push('Favor pandas for tabular data work.');
            return { language: 'python', framework: 'none', projectType: 'script', rules };
        }

        if (normalized.includes('simple') || normalized.includes('todo') || normalized.includes('to-do')) {
            rules.push('Prefer no build tooling for the initial scaffold.');
            return { language: 'javascript', framework: 'none', projectType: 'script', rules };
        }

        return {
            language: 'typescript',
            framework: 'nextjs',
            projectType: 'app-router',
            rules: rules.concat(['Default to modern Next.js 14+ conventions.']),
        };
    }

    private async readPackageJson(): Promise<Record<string, string>> {
        try {
            const raw = await this.mcpClient.readResource(`file://${WORKSPACE_PATH}/package.json`);
            const parsed = JSON.parse(raw ?? '{}');
            return { ...(parsed.dependencies ?? {}), ...(parsed.devDependencies ?? {}) };
        } catch {
            return {};
        }
    }
}
