# Qubide: The Cloud IDE

## Overview

Qubide is a cloud-native integrated development environment that lets developers write, build, execute, and download code entirely in the browser. It leverages containerization and Kubernetes to isolate user workspaces and support multiple programming languages.

Key capabilities:

* Browser-based code editor with syntax highlighting and IntelliSense
* Integrated terminal for executing commands
* Automatic workspace provisioning using Kubernetes
* Support for multiple language servers (TypeScript, Python, C, Java etc.)

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
kind create cluster --name qubide
```

### 2. Install Ingress Controller

Apply the ingress-nginx manifest:

```bash
kubectl apply -f server/k8s/ingress-nginx-controller.yaml
```

### 3. Create namespace `qubide`

```bash
kubectl create namespace qubide
```

### 4. Setup MinIO

Install the MinIO manifest and apply necessary secrets in the `qubide` namespace:

```bash
kubectl apply -f server/k8s/minio/minio-dev.yaml
kubectl apply -f server/k8s/minio/runner.secrets.example.yaml
```

### 5. Apply `ServiceAccount` for runner

```bash
kubectl apply -f server/k8s/runner-sa.yaml
```

**Note**: The manifest for resources is kept in server/api-gateway/src/kubernetes/manifest/service.yaml. This is applied automatically when a user creates app.

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

Huge thanks to [Piyush Garg](https://www.linkedin.com/in/piyushgarg195) for the idea and [Harkirat Singh](https://www.linkedin.com/in/kirat-li) for the guidance and implementation.

## Contributing

Contributions are welcome. Please fork the repository and submit pull requests for:

* Bug fixes
* New features
* Documentation improvements

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
