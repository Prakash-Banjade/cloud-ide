import { Injectable } from '@nestjs/common';
import { GraphState, ValidationIssue } from '../types';
import { ToolsService } from '../tools.service';

@Injectable()
export class ValidationAgent {
    constructor(private readonly toolsService: ToolsService) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const profile = state.project_profile ?? state.stack_context?.profile;
        const issues: ValidationIssue[] = [];

        const paths = await this.toolsService.listWorkspacePaths();

        if (profile?.framework === 'next' && profile.router === 'app') {
            if (paths.some((p) => p.startsWith('pages/'))) {
                issues.push({
                    message: 'Detected pages/ directory in an App Router project.',
                    suggestion: 'Remove pages/ and keep routing exclusively under app/.',
                });
            }
        }

        if (profile?.framework === 'next' && profile.router === 'pages') {
            if (paths.some((p) => p.startsWith('app/'))) {
                issues.push({
                    message: 'Detected app/ directory alongside Pages Router.',
                    suggestion: 'Standardize on pages/ routing or intentionally migrate.',
                });
            }
        }

        return {
            validation_issues: issues,
            status: issues.length ? 'NEEDS_FIX' : state.status ?? 'READY_FOR_TESTS',
        };
    }
}
