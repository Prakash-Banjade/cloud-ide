import { AppsV1Api, CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { ResourceStartDto } from './dto/start-resource.dto';
import * as path from 'path';

const namespace = "qubide" as const;

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly coreV1Api: CoreV1Api,
    private readonly appsV1Api: AppsV1Api,
    private readonly networkingV1Api: NetworkingV1Api
  ) { }

  async startResource(dto: ResourceStartDto) {
    const { replId } = dto;

    const manifests = this.readAndParseKubeYaml(
      path.join(__dirname, './kubernetes/manifest/service.yaml'),
      replId,
    );

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
        this.logger.log(`Deployment ${body.metadata?.name} is already running`);  // :contentReference[oaicite:0]{index=0}
        return;
      }
      this.logger.log(`Deployment ${body.metadata?.name} exists but has no available replicas, updating...`);
      await this.appsV1Api.replaceNamespacedDeployment({
        body: manifest,
        name: manifest.metadata.name,
        namespace,
      });  // :contentReference[oaicite:1]{index=1}
    } catch (err: any) {
      if (err.response?.statusCode === 404) {
        this.logger.log(`Creating Deployment ${manifest.metadata.name}...`);
        await this.appsV1Api.createNamespacedDeployment({
          body: manifest,
          namespace,
        });  // :contentReference[oaicite:2]{index=2}
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
      if (err.response?.statusCode === 404) {
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
      if (err.response?.statusCode === 404) {
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

  private readAndParseKubeYaml = (filePath: string, replId: string): Array<any> => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const docs = yaml.parseAllDocuments(fileContent).map((doc) => {
      let docString = doc.toString();
      const regex = new RegExp(`service_name`, 'g');
      docString = docString.replace(regex, replId);
      return yaml.parse(docString);
    });
    return docs;
  };
}
