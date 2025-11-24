import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { WORKSPACE_PATH } from 'src/CONSTANTS';
import { ProjectProfile } from './types';

@Injectable()
export class ProjectProfileService {
    async generateProfile(): Promise<ProjectProfile> {
        const packageJson = await this.readJson(path.join(WORKSPACE_PATH, 'package.json'));
        const dependencies = {
            ...(packageJson?.dependencies ?? {}),
            ...(packageJson?.devDependencies ?? {}),
        } as Record<string, string>;

        const configFiles = await this.detectConfigFiles();
        const language = this.detectLanguage(dependencies);
        const framework = this.detectFramework(dependencies, configFiles);
        const router = this.detectRouter(dependencies);

        const srcDir = await this.detectPreferredDir('src');
        const appDir = await this.detectAppDir(srcDir);
        const conventions = await this.detectConventions(srcDir, appDir);

        const versions = {
            next: dependencies['next'],
            react: dependencies['react'],
            node: process.version,
        };

        return {
            framework,
            router,
            language,
            srcDir,
            appDir,
            conventions,
            versions,
            configFiles,
        };
    }

    private async detectPreferredDir(candidate: string): Promise<string | null> {
        const target = path.join(WORKSPACE_PATH, candidate);
        return (await this.pathExists(target)) ? candidate : null;
    }

    private async detectAppDir(srcDir: string | null): Promise<string | null> {
        const appPaths = [
            srcDir ? path.join(srcDir, 'app') : null,
            'app',
            srcDir ? path.join(srcDir, 'pages') : null,
            'pages',
        ].filter(Boolean) as string[];

        for (const rel of appPaths) {
            if (await this.pathExists(path.join(WORKSPACE_PATH, rel))) {
                return rel;
            }
        }

        return null;
    }

    private detectLanguage(deps: Record<string, string>): ProjectProfile['language'] {
        if (deps['typescript'] || fs.existsSync(path.join(WORKSPACE_PATH, 'tsconfig.json'))) return 'ts';
        if (fs.existsSync(path.join(WORKSPACE_PATH, 'pyproject.toml')) || fs.existsSync(path.join(WORKSPACE_PATH, 'requirements.txt'))) return 'py';
        if (fs.existsSync(path.join(WORKSPACE_PATH, 'pom.xml'))) return 'java';
        return 'js';
    }

    private detectFramework(deps: Record<string, string>, configFiles: string[]): ProjectProfile['framework'] {
        if (deps['next']) return 'next';
        if (deps['react']) return 'react';
        if (deps['express'] || deps['nestjs']) return 'node';
        if (configFiles.some((file) => file.startsWith('next.config'))) return 'next';
        if (configFiles.some((file) => file.startsWith('vite.config'))) return 'react';
        return 'unknown';
    }

    private detectRouter(deps: Record<string, string>): ProjectProfile['router'] {
        const appRouterPaths = ['app', 'src/app'];
        const pagesRouterPaths = ['pages', 'src/pages'];

        const hasApp = appRouterPaths.some((p) => fs.existsSync(path.join(WORKSPACE_PATH, p)));
        const hasPages = pagesRouterPaths.some((p) => fs.existsSync(path.join(WORKSPACE_PATH, p)));

        if (deps['next']) {
            if (hasApp) return 'app';
            if (hasPages) return 'pages';
            return 'app';
        }

        return hasPages ? 'pages' : 'none';
    }

    private async detectConventions(srcDir: string | null, appDir: string | null): Promise<ProjectProfile['conventions']> {
        const candidates = [srcDir ?? '', ''];
        const conventions: ProjectProfile['conventions'] = {};

        for (const base of candidates) {
            const basePath = base ? `${base}/` : '';
            const maybeComponents = `${basePath}components`;
            const maybeHooks = `${basePath}hooks`;
            const maybeLib = `${basePath}lib`;
            const maybeUtils = `${basePath}utils`;
            const maybeTests = `${basePath}__tests__`;

            if (!conventions.componentsDir && (await this.pathExists(path.join(WORKSPACE_PATH, maybeComponents)))) {
                conventions.componentsDir = maybeComponents;
            }
            if (!conventions.hooksDir && (await this.pathExists(path.join(WORKSPACE_PATH, maybeHooks)))) {
                conventions.hooksDir = maybeHooks;
            }
            if (!conventions.utilsDir && (await this.pathExists(path.join(WORKSPACE_PATH, maybeLib)))) {
                conventions.utilsDir = maybeLib;
            }
            if (!conventions.utilsDir && (await this.pathExists(path.join(WORKSPACE_PATH, maybeUtils)))) {
                conventions.utilsDir = maybeUtils;
            }
            if (!conventions.testsDir && (await this.pathExists(path.join(WORKSPACE_PATH, maybeTests)))) {
                conventions.testsDir = maybeTests;
            }
        }

        conventions.pagesDir = appDir ?? undefined;
        return conventions;
    }

    private async detectConfigFiles(): Promise<string[]> {
        const configs = ['next.config.js', 'next.config.mjs', 'next.config.ts', 'vite.config.ts', 'vite.config.js', 'tsconfig.json'];
        const found: string[] = [];
        for (const file of configs) {
            if (await this.pathExists(path.join(WORKSPACE_PATH, file))) {
                found.push(file);
            }
        }
        return found;
    }

    private async pathExists(target: string): Promise<boolean> {
        try {
            await fsp.access(target, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    private async readJson(target: string): Promise<any | null> {
        try {
            const raw = await fsp.readFile(target, 'utf-8');
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
}
