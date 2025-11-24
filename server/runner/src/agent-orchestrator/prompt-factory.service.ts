import { Injectable } from '@nestjs/common';
import { ProjectProfile, StackContext } from './types';

@Injectable()
export class PromptFactory {
    private getBaseRules(context?: StackContext): string[] {
        if (!context) return [];

        const rules: string[] = [...(context.rules ?? [])];

        if (context.framework === 'nextjs') {
            if (context.projectType === 'app-router') {
                rules.push('Project uses the Next.js App Router. DO NOT create a pages/ directory.');
                rules.push('Routes are folder-based under the app directory.');
                rules.push('Default to server components; add "use client" only when hooks or browser APIs are required.');
            } else if (context.projectType === 'pages-router') {
                rules.push('Project uses the Next.js Pages Router. Keep routes in pages/.');
            }
        }

        if (context.language === 'python') {
            rules.push('Use snake_case for all functions and variables.');
            rules.push('Annotate functions with type hints.');
        }

        if (context.language === 'cpp' || context.language === 'c++') {
            rules.push('Use CMake for builds.');
            rules.push('Split headers (.h/.hpp) and implementation (.cpp) files.');
        }

        return Array.from(new Set(rules));
    }

    private renderConventions(profile?: ProjectProfile): string {
        if (!profile) return '';

        const segments: string[] = [];

        if (profile.framework === 'next' && profile.router === 'app') {
            segments.push(
                'This project uses Next.js App Router: keep routes inside the app/ directory and NEVER create pages/.',
                'Use file-based routing: each folder inside app/ is a segment and page.tsx makes it public.',
            );
            if (profile.conventions.componentsDir) {
                segments.push(`Place shared UI in ${profile.conventions.componentsDir}.`);
            }
            if (profile.conventions.hooksDir) {
                segments.push(`Place shared hooks in ${profile.conventions.hooksDir}.`);
            }
            if (profile.conventions.utilsDir) {
                segments.push(`Keep utilities in ${profile.conventions.utilsDir}.`);
            }
        }

        if (profile.framework === 'react' && profile.router === 'none') {
            if (profile.conventions.componentsDir) {
                segments.push(`Reuse the components directory at ${profile.conventions.componentsDir}.`);
            }
            if (profile.conventions.hooksDir) {
                segments.push(`Reuse hooks from ${profile.conventions.hooksDir}.`);
            }
        }

        return segments.length ? ['CONVENTIONS:', ...segments.map((item) => `- ${item}`)].join('\n') : '';
    }

    renderRulebook(context?: StackContext): string {
        const rules = this.getBaseRules(context);
        const conventions = this.renderConventions(context?.profile);
        if (!rules.length && !conventions) {
            return '';
        }

        const header = context
            ? `STACK: ${context.framework || context.language}`
            : 'STACK RULES';

        const parts = [header, ...rules.map((rule) => `- ${rule}`)];
        if (conventions) {
            parts.push(conventions);
        }

        return parts.join('\n');
    }
}
