import { AppsV1Api, CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import { ForbiddenException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as yaml from 'yaml';
import * as path from 'path';
import { ResourceStartDto } from './dto/create-project.dto';
import { AuthUser, ELanguage } from 'src/common/global.types';
import { LANG_PORT } from 'src/common/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';

const namespace = "qubide" as const;

@Injectable()
export class OrchestratorService {
    private readonly logger = new Logger(OrchestratorService.name);

    constructor(
        @InjectRepository(Project) private readonly projectRepo: Repository<Project>,
        private readonly coreV1Api: CoreV1Api,
        private readonly appsV1Api: AppsV1Api,
        private readonly networkingV1Api: NetworkingV1Api
    ) { }

    async startResource(dto: ResourceStartDto, currentUser: AuthUser) {
        const project = await this.projectRepo.findOne({
            where: {
                replId: dto.replId,
                createdBy: { id: currentUser.userId }
            },
            select: { id: true, language: true }
        });

        if (!project) throw new ForbiddenException('Access denied.');

        const manifests = this.readAndParseKubeYaml({
            filePath: path.join(__dirname, '../kubernetes/manifest/service.yaml'),
            replId: dto.replId,
            language: project.language
        });

        for (const m of manifests) {
            switch (m.kind) {
                case 'Deployment':
                    await this.ensureDeployment(m);
                    break;
                case 'Service':
                    await this.ensureService(m);
                    break;
                case 'Ingress':
                    await this.ensureIngress(m);
                    break;
                default:
                    this.logger.warn(`Unsupported kind: ${m.kind}`);
            }
        }

        return { message: 'Resources started (or already running) successfully' };
    }

    private async ensureDeployment(manifest: any) {
        try {
            const body = await this.appsV1Api.readNamespacedDeployment({
                name: manifest.metadata.name,
                namespace,
            });

            // If it exists, check status:
            if ((body.status?.availableReplicas ?? 0) > 0) {
                this.logger.log(`Deployment ${body.metadata?.name} is already running`);
                return;
            }

            this.logger.log(`Deployment ${body.metadata?.name} exists but has no available replicas, updating...`);
            await this.appsV1Api.replaceNamespacedDeployment({
                body: manifest,
                name: manifest.metadata.name,
                namespace,
            });
        } catch (err: any) {
            if (err?.code === 404) {
                this.logger.log(`Creating Deployment ${manifest.metadata.name}...`);
                await this.appsV1Api.createNamespacedDeployment({
                    body: manifest,
                    namespace,
                });
            } else {
                throw new HttpException(`Error checking Deployment: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    private async ensureService(manifest: any) {
        try {
            await this.coreV1Api.readNamespacedService({
                name: manifest.metadata.name,
                namespace,
            });
            this.logger.log(`Service ${manifest.metadata.name} already exists`);  // :contentReference[oaicite:3]{index=3}
        } catch (err: any) {
            if (err?.code === 404) {
                this.logger.log(`Creating Service ${manifest.metadata.name}...`);
                await this.coreV1Api.createNamespacedService({
                    body: manifest,
                    namespace,
                });
            } else {
                throw err;
            }
        }
    }

    private async ensureIngress(manifest: any) {
        try {
            await this.networkingV1Api.readNamespacedIngress({
                name: manifest.metadata.name,
                namespace
            });
            this.logger.log(`Ingress ${manifest.metadata.name} already exists`);
        } catch (err: any) {
            if (err?.code === 404) {
                this.logger.log(`Creating Ingress ${manifest.metadata.name}...`);
                await this.networkingV1Api.createNamespacedIngress({
                    body: manifest,
                    namespace
                });
            } else {
                throw err;
            }
        }
    }

    private readAndParseKubeYaml = ({
        filePath, replId, language
    }: {
        filePath: string, replId: string, language: ELanguage
    }): Array<any> => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const docs = yaml.parseAllDocuments(fileContent).map((doc) => {
            let docString = doc.toString();
            docString = docString
                .replace(new RegExp(`service_name`, 'g'), replId)
                .replace(new RegExp(`LANG_PORT`, 'g'), LANG_PORT[language] ?? 3000);
            return yaml.parse(docString);
        });
        return docs;
    };
}
