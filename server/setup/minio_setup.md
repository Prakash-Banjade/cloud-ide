Ref: https://min.io/docs/minio/kubernetes/upstream/index.html

**Note**: Don't forget to replace the node hostname with your worker node hostname.
To check the node hostname, run the command `kubectl get nodes --show-labels`

Also, apply secrets manifest from `server/k8s` which is required by `orchestrator/kubernetes/manifest/service.yaml`

## Adding user access key and secret key

1. mc alias set minio http://minio.minio-dev.svc.cluster.local:9000 "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
2. mc admin user add minio "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"