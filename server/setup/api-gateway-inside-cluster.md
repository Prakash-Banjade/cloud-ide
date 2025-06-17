### When api-gateway runs inside the cluster, things changes a little bit:

1. Set `useSSL` to false in minio.module.ts when using with SSL. Because the communication will be over http internally.
2. Since api-gateway runs inside different namespace, it won't have permission to read, write, delete resources inside `qubide` ns. So role binding is required. Apply the k8s/`orchestrator-sa.yaml` and update `api-gateway.yaml` as:

```yaml
spec:
  template:
    spec:
      serviceAccountName: orchestrator-sa
      containers:
      - name: api-gateway
        image: prakashbanjade/cloud-ide-api-gateway:latest
```
3. Since the app will run inside the cluster, kubernetes client should be loaded from cluster i.e use `kc.loadFromCluster()` instead of `kc.loadFromDefault()`.