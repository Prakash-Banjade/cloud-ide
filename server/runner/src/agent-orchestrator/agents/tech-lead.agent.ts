import { Injectable } from '@nestjs/common';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { McpClientService } from '../mcp-client.service';
import { GraphState, ProjectProfile, StackContext } from '../types';
import { ProjectProfileService } from '../project-profile.service';

@Injectable()
export class TechLeadAgent {
    constructor(
        private readonly mcpClient: McpClientService,
        private readonly projectProfileService: ProjectProfileService,
    ) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const project_profile = await this.projectProfileService.generateProfile();
        let resources: any[] = [];
        try {
            resources = await this.mcpClient.listResources();
        } catch (error) {
            console.warn('TechLead: failed to list resources via MCP', error);
        }

        const workspacePaths = this.extractPaths(resources);
        const hasExistingProject = workspacePaths.length > 0;

        const stackContext = hasExistingProject
            ? await this.detectFromWorkspace(workspacePaths, project_profile)
            : this.inferFromPrompt(state.user_prompt ?? '', project_profile);

        return { stack_context: stackContext, project_profile };
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

    private async detectFromWorkspace(paths: string[], profile: ProjectProfile): Promise<StackContext> {
        const lowerPaths = paths.map((p) => p.toLowerCase());
        const rules = ['Respect the existing repository conventions and directory layout.'];

        if (lowerPaths.some((p) => p.includes('pom.xml'))) {
            rules.push('Preserve Maven module structure.');
            return { language: 'java', framework: 'none', projectType: 'binary', rules, profile };
        }

        if (lowerPaths.some((p) => p.includes('cargo.toml'))) {
            rules.push('Use cargo for builds and dependency management.');
            return { language: 'rust', framework: 'none', projectType: 'binary', rules, profile };
        }

        if (lowerPaths.some((p) => p.includes('pyproject.toml') || p.endsWith('.py'))) {
            rules.push('Keep modules organized with __init__.py where appropriate.');
            return { language: 'python', framework: 'none', projectType: 'script', rules, profile };
        }

        if (profile.framework === 'next') {
            if (profile.router === 'app') {
                rules.push('STRICT: Use Next.js App Router under the app/ directory and never create pages/.');
                if (profile.conventions.componentsDir) rules.push(`Place shared UI in ${profile.conventions.componentsDir}.`);
                if (profile.conventions.hooksDir) rules.push(`Store hooks in ${profile.conventions.hooksDir}.`);
                return { language: profile.language === 'ts' ? 'typescript' : 'javascript', framework: 'nextjs', projectType: 'app-router', rules, profile };
            }
            rules.push('Follow Next.js Pages Router conventions under pages/.');
            return { language: profile.language === 'ts' ? 'typescript' : 'javascript', framework: 'nextjs', projectType: 'pages-router', rules, profile };
        }

        if (profile.framework === 'react') {
            if (profile.conventions.componentsDir) rules.push(`Reuse components under ${profile.conventions.componentsDir}.`);
            if (profile.conventions.hooksDir) rules.push(`Reuse hooks under ${profile.conventions.hooksDir}.`);
            return { language: profile.language === 'ts' ? 'typescript' : 'javascript', framework: 'react', projectType: 'pages-router', rules, profile };
        }

        return {
            language: profile.language === 'ts' ? 'typescript' : 'javascript',
            framework: 'none',
            projectType: profile.router === 'pages' ? 'pages-router' : 'app-router',
            rules,
            profile,
        };
    }

    private inferFromPrompt(prompt: string, profile: ProjectProfile): StackContext {
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
            language: profile.language === 'ts' ? 'typescript' : 'javascript',
            framework: 'nextjs',
            projectType: 'app-router',
            rules: rules.concat(['Default to modern Next.js 14+ conventions.']),
            profile,
        };
    }
}
