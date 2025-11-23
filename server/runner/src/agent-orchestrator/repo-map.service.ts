import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { promises as fs } from 'fs';
import { WORKSPACE_PATH } from 'src/CONSTANTS';

const DEFAULT_IGNORES = new Set([
    'node_modules',
    'dist',
    'build',
    '.next',
    '.git',
    'coverage',
    '.DS_Store',
    '__pycache__',
    'target',
]);

@Injectable()
export class RepoMapService {
    async generateRepoMap(maxDepth = 5): Promise<string> {
        try {
            const ignoreRules = await this.loadGitignoreRules(WORKSPACE_PATH);
            const treeLines = await this.walk(WORKSPACE_PATH, '', 0, maxDepth, ignoreRules);
            return treeLines.join('\n') || '(workspace empty)';
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return `Failed to build repo map: ${message}`;
        }
    }

    private async walk(
        currentPath: string,
        prefix: string,
        depth: number,
        maxDepth: number,
        ignoreRules: RegExp[],
    ): Promise<string[]> {
        if (depth >= maxDepth) {
            return [];
        }

        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        const visibleEntries = entries
            .filter((entry) => !this.shouldIgnore(entry, currentPath, ignoreRules))
            .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));

        const lines: string[] = [];

        for (let index = 0; index < visibleEntries.length; index++) {
            const entry = visibleEntries[index];
            const connector = index === visibleEntries.length - 1 ? '└── ' : '├── ';
            const nextPrefix = index === visibleEntries.length - 1 ? `${prefix}    ` : `${prefix}│   `;
            const displayName = entry.isDirectory() ? `${entry.name}/` : entry.name;

            lines.push(`${prefix}${connector}${displayName}`);

            if (entry.isDirectory()) {
                const childLines = await this.walk(path.join(currentPath, entry.name), nextPrefix, depth + 1, maxDepth, ignoreRules);
                lines.push(...childLines);
            }
        }

        return lines;
    }

    private shouldIgnore(entry: any, currentPath: string, ignoreRules: RegExp[]): boolean {
        if (DEFAULT_IGNORES.has(entry.name)) return true;

        const relativePath = path.relative(WORKSPACE_PATH, path.join(currentPath, entry.name));
        return ignoreRules.some((rule) => rule.test(relativePath));
    }

    private async loadGitignoreRules(root: string): Promise<RegExp[]> {
        try {
            const gitignorePath = path.join(root, '.gitignore');
            const content = await fs.readFile(gitignorePath, 'utf8');
            const patterns = content
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith('#'));

            return patterns.map((pattern) => this.patternToRegex(pattern));
        } catch {
            return [];
        }
    }

    private patternToRegex(pattern: string): RegExp {
        const escaped = pattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*');

        const finalPattern = pattern.startsWith('/')
            ? `^${escaped.slice(1)}$`
            : `^${escaped}$`;

        return new RegExp(finalPattern);
    }
}
