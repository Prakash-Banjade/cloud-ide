import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KubeConfig, CoreV1Api, AppsV1Api, NetworkingV1Api } from '@kubernetes/client-node';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: KubeConfig,
            useFactory: (cfg: ConfigService) => {
                const kc = new KubeConfig();

                const kubeconfigPath = cfg.get<string>('KUBECONFIG');
                if (kubeconfigPath) {
                    kc.loadFromFile(kubeconfigPath);
                    return kc;
                }

                cfg.get('NODE_ENV') === 'production'
                    ? kc.loadFromCluster()
                    : kc.loadFromDefault();

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
    ],
    exports: [KubeConfig, CoreV1Api, AppsV1Api, NetworkingV1Api],
})
export class KubernetesModule { }
