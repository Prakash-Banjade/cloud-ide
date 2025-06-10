import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KubeConfig, CoreV1Api, AppsV1Api, NetworkingV1Api } from '@kubernetes/client-node';
import { KubernetesService } from './kubernetes.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: KubeConfig,
            useFactory: (cfg: ConfigService) => {
                const kc = new KubeConfig();

                // 1️⃣ If you have a KUBECONFIG path, load from file:
                const kubeconfigPath = cfg.get<string>('KUBECONFIG');
                if (kubeconfigPath) {
                    kc.loadFromFile(kubeconfigPath);
                    return kc;
                }

                // 2️⃣ Else, assume in-cluster:
                kc.loadFromDefault();
                return kc;
            },
            inject: [ConfigService],
        },
        {
            provide: CoreV1Api,
            useFactory: (kc: KubeConfig) => kc.makeApiClient(CoreV1Api),
            inject: [KubeConfig],
        },
        {
            provide: AppsV1Api,
            useFactory: (kc: KubeConfig) => kc.makeApiClient(AppsV1Api),
            inject: [KubeConfig],
        },
        {
            provide: NetworkingV1Api,
            useFactory: (kc: KubeConfig) => kc.makeApiClient(NetworkingV1Api),
            inject: [KubeConfig],
        },
        KubernetesService,
    ],
    exports: [KubeConfig, CoreV1Api, AppsV1Api, NetworkingV1Api, KubernetesService],
})
export class KubernetesModule { }
