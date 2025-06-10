import { AppsV1Api, CoreV1Api, NetworkingV1Api } from "@kubernetes/client-node";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";

const namespace = "qubide" as const;

@Injectable()
export class KubernetesService {
    private readonly logger = new Logger(KubernetesService.name);

    constructor(
        private readonly coreV1Api: CoreV1Api,
        private readonly appsV1Api: AppsV1Api,
        private readonly networkingV1Api: NetworkingV1Api
    ) { }

    async shutdown(replId: string): Promise<void> {
        this.logger.log(`Shutting down repl ${replId}`);
        
        try {
            this.logger.log(`Deleting Ingress '${replId}' in namespace '${namespace}'.`);
            await this.networkingV1Api.deleteNamespacedIngress({
                name: replId,
                namespace,
                // can also pass a DeleteOptions body (e.g. gracePeriodSeconds)
            });
            this.logger.log(`Ingress '${replId}' deletion requested.`);
        } catch (err: any) {
            if (err?.code === 404) {
                this.logger.log(`Ingress '${replId}' not found; skipping deletion.`);
            } else {
                this.logger.error(`Error deleting Ingress '${replId}': ${err.message}`);
                // Depending on your policy, you can either rethrow or swallow:
                throw new HttpException(`Failed to delete Ingress: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        try {
            this.logger.log(`Deleting Service '${replId}' in namespace '${namespace}'.`);
            await this.coreV1Api.deleteNamespacedService({
                name: replId,
                namespace,
            });
            this.logger.log(`Service '${replId}' deletion requested.`);
        } catch (err: any) {
            if (err?.code === 404) {
                this.logger.log(`Service '${replId}' not found; skipping deletion.`);
            } else {
                this.logger.error(`Error deleting Service '${replId}': ${err.message}`);
                throw new HttpException(`Failed to delete Service: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        try {
            this.logger.log(`Deleting Deployment '${replId}' in namespace '${namespace}'.`);
            await this.appsV1Api.deleteNamespacedDeployment({
                name: replId,
                namespace,
                // can pass DeleteOptions as the “body”, e.g. set gracePeriodSeconds
            });
            this.logger.log(`Deployment '${replId}' deletion requested.`);
        } catch (err: any) {
            if (err?.code === 404) {
                this.logger.log(`Deployment '${replId}' not found; skipping deletion.`);
            } else {
                this.logger.error(`Error deleting Deployment '${replId}': ${err.message}`);
                throw new HttpException(`Failed to delete Deployment: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
}