import { AppsV1Api, CoreV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { ResourceStartDto } from './dto/start-resource.dto';
import * as path from 'path';

const namespace = "qubide" as const;

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly coreV1Api: CoreV1Api,
    private readonly appsV1Api: AppsV1Api,
    private readonly networkingV1Api: NetworkingV1Api
  ) { }

  async startResource(dto: ResourceStartDto) {
    const { replId } = dto; // Assume a unique identifier for each user

    const kubeManifests = this.readAndParseKubeYaml(path.join(__dirname, "./kubernetes/manifest/service.yaml"), replId);

    for (const manifest of kubeManifests) {
      switch (manifest.kind) {
        case "Deployment":
          await this.appsV1Api.createNamespacedDeployment({ namespace, body: manifest });
          break;
        case "Service":
          await this.coreV1Api.createNamespacedService({ namespace, body: manifest });
          break;
        case "Ingress":
          await this.networkingV1Api.createNamespacedIngress({ namespace, body: manifest });
          break;
        default:
          console.log(`Unsupported kind: ${manifest.kind}`);
      }
    }

    return { message: "Resources created successfully" };
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
