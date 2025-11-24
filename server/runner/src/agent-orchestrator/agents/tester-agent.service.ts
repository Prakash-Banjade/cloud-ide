import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { GraphState, ProjectProfile, TestRunResult } from '../types';
import { ToolsService } from '../tools.service';

@Injectable()
export class TesterAgent {
    constructor(private readonly toolsService: ToolsService) { }

    async execute(state: GraphState): Promise<Partial<GraphState>> {
        const profile = state.project_profile ?? state.stack_context?.profile;
        const commands = await this.buildCommands(profile);
        const testResults: TestRunResult = { attempted: commands.length > 0, commands: [] };

        const hasNodeModules = fs.existsSync(path.join(WORKSPACE_PATH, 'node_modules'));
        if (!commands.length || !hasNodeModules) {
            return { test_results: testResults, status: state.status ?? 'DONE' };
        }

        for (const cmd of commands) {
            const result = await this.toolsService.runCommand(cmd.command, cmd.cwd);
            testResults.commands.push(result);
            if (!result.success) {
                return { test_results: testResults, status: 'NEEDS_FIX' };
            }
        }

        return { test_results: testResults, status: 'DONE' };
    }

    private async buildCommands(profile?: ProjectProfile): Promise<Array<{ command: string; cwd: string }>> {
        const commands: Array<{ command: string; cwd: string }> = [];
        const packageJsonPath = path.join(WORKSPACE_PATH, 'package.json');

        if (!fs.existsSync(packageJsonPath)) {
            return commands;
        }

        try {
            const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8')) as { scripts?: Record<string, string> };
            const scripts = packageJson.scripts ?? {};

            if (scripts['lint']) {
                commands.push({ command: 'npm run lint', cwd: WORKSPACE_PATH });
            } else if (profile?.framework === 'next') {
                commands.push({ command: 'npm run lint || npx next lint', cwd: WORKSPACE_PATH });
            }

            if (scripts['test']) {
                commands.push({ command: 'npm test -- --runInBand --passWithNoTests', cwd: WORKSPACE_PATH });
            }
        } catch (error) {
            console.warn('TesterAgent: failed to read package.json', error);
        }

        return commands;
    }
}
