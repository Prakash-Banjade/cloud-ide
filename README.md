# Qubide: The Cloud IDE

## Overview

Qubide is a cloud-native integrated development environment that lets developers write, build, execute, and download code entirely in the browser. It also provides AI chat feature which allows users to vibe code. It leverages containerization and Kubernetes to isolate user workspaces and support multiple programming languages.

Key capabilities:

* Browser-based code editor with syntax highlighting and IntelliSense
* Integrated terminal for executing commands
* Automatic workspace provisioning using Kubernetes
* Support for multiple language servers (TypeScript, Python, C, Java etc.)
* Collaborative Editing
* AI chat and vibe coding

## Prerequisites

Before you begin, ensure you have the following installed:

* [Docker](https://www.docker.com/)
* [Node.js](https://nodejs.org/)
* [kubectl](https://kubernetes.io/docs/tasks/tools/)
* [kind](https://kind.sigs.k8s.io/)

## Local Setup

Follow these steps to run Qubide on your local machine using a kind cluster.

### 1. Create a kind cluster

```bash
kind create cluster --name dev --config server/k8s/kind-config.yaml
```

### 2. Install Ingress Controller

Apply the ingress-nginx manifest:

```bash
kubectl create ns ingress-nginx
kubectl apply -f server/k8s/ingress-nginx-controller.yaml
```

### 3. Create namespace `qubide` and `qubide-main`

```bash
kubectl apply -f server/k8s/project-ns.yaml
```
Just to separate the main backend and other pods (user apps), separate ns is choosed.

### 4. Setup MinIO

1. Install the MinIO:

```bash
kubectl apply -f server/k8s/minio/minio-dev.yaml
```

2. Run minio (inside cluster)

```bash
kubectl port-forward service/minio 9000:9000 9090:9090 -n minio-dev --address=0.0.0.0
```

3. Open minio client by navigating to `http://localhost:9000`
4. Create a bucket with name `cloud-ide`
5. Upload the server/base directory. This will upload the base files for each project langauges. You can customize based on your need.

### 5. Apply `ServiceAccount` for runner

```bash
kubectl apply -f server/k8s/runner-sa.yaml
```

**Note**: The manifest for resources is kept in server/api-gateway/src/kubernetes/manifest/service.yaml. This is applied automatically when a user creates app.

### 6. Apply runner secrets

```bash
kubectl apply -f server/k8s/runner.secrets.example.yaml
```

## Development Workflow

### Backend (API Gateway)

1. Navigate to the backend folder:

   ```bash
   cd server/api-gateway
   ```
2. Install dependencies and start in watch mode:

   ```bash
   pnpm install
   pnpm dev
   ```
**Env**: .env.example  
Don't forget to synchronize the database once.

### Backend (Runner)

1. Navigate to the backend folder:

   ```bash
   cd server/runner
   ```
2. Install dependencies and build the docker image and push it to the registry:

   ```bash
   pnpm install
   docker build -t username/cloud-ide-runner . && docker push username/cloud-ide-runner
   ```
**Note**: Should replace the image in service.yaml

### Frontend

1. Navigate to the frontend folder:

   ```bash
   cd client
   ```
2. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```
   **Env**: .env.example
    
## Domain Stuff

You need two different domains for the project. One that points the runner application (for ws) and another that points to the running process (like localhost:3000) in the pod. 
Then point wild card subdomain host of both the domains to the ingress-controller EXTERNAL IP in your DNS record.  

To ge the ingress-controller external IP, run the following command:

```bash
kubectl get svc -n ingress-nginx
```

## References

Huge thanks to [Piyush Garg](https://www.linkedin.com/in/piyushgarg195) for the idea, [Harkirat Singh](https://www.linkedin.com/in/kirat-li) and [TrainWithShubham](https://www.linkedin.com/company/trainwithshubham) for the guidance and implementation.

## Contributing

Contributions are welcome. Please fork the repository and submit pull requests for:

* Bug fixes
* New features
* Documentation improvements

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
