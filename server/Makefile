docker-push-api-gateway:
	docker build -t prakashbanjade/cloud-ide-api-gateway:latest ./api-gateway && docker push prakashbanjade/cloud-ide-api-gateway:latest

docker-push-runner:
	docker build -t prakashbanjade/cloud-ide-runner:latest ./runner && docker push prakashbanjade/cloud-ide-runner:latest

docker-push-pty:
	docker build -t prakashbanjade/cloud-ide-pty:latest ./pty && docker push prakashbanjade/cloud-ide-pty:latest

docker-push-api-gateway-with-arm64:
	docker buildx build --platform linux/amd64,linux/arm64  -t prakashbanjade/cloud-ide-api-gateway:latest --push /api-gateway

minio:
	kubectl port-forward service/minio 9000:9000 9090:9090 -n minio-dev --address=0.0.0.0