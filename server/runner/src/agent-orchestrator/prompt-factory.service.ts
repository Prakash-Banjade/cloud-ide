import { Injectable } from '@nestjs/common';
import { StackContext } from './types';

@Injectable()
export class PromptFactory {
    private getBaseRules(context?: StackContext): string[] {
        if (!context) return [];

        const rules: string[] = [...(context.rules ?? [])];

        if (context.framework === 'nextjs') {
            if (context.projectType === 'app-router') {
                rules.push(
                    'Use the Next.js App Router with the app/ directory, layout.tsx, and route.ts files.'
                );
                rules.push('Default to server components; add "use client" only when hooks or browser APIs are required.');
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

    renderRulebook(context?: StackContext): string {
        const rules = this.getBaseRules(context);
        if (!rules.length) {
            return '';
        }

        const header = context
            ? `STACK: ${context.framework || context.language}`
            : 'STACK RULES';

        return [header, ...rules.map((rule) => `- ${rule}`)].join('\n');
    }
}
