1. Docker push api-gateway:
```shell
docker build -t prakashbanjade/cloud-ide-api-gateway:latest ./api-gateway && docker push prakashbanjade/cloud-ide-api-gateway:latest
```

2. Docker push runner:
```shell
docker build -t prakashbanjade/cloud-ide-runner:latest ./runner && docker push prakashbanjade/cloud-ide-runner:latest
```

3. Docker push pty:
```shell
docker build -t prakashbanjade/cloud-ide-pty:latest ./pty && docker push prakashbanjade/cloud-ide-pty:latest
```

4. Docker push api-gateway with arm64:
```shell
docker buildx build --platform linux/amd64,linux/arm64  -t prakashbanjade/cloud-ide-api-gateway:latest --push .
```

5. Docker push runner with arm64:
```shell
docker buildx build --platform linux/amd64,linux/arm64  -t prakashbanjade/cloud-ide-runner:latest --push .
```

6. Docker push pty with arm64:
```shell
docker buildx build --platform linux/amd64,linux/arm64  -t prakashbanjade/cloud-ide-pty:latest --push .
```

7. Port forward minio
```shell
kubectl port-forward service/minio 9000:9000 9090:9090 -n minio-dev --address=0.0.0.0
```