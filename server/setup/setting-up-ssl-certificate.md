In Kubernetes you almost never generate and manage TLS certificates inside each Pod—instead you terminate TLS at the edge (Ingress or service‐mesh) using certificates provisioned and renewed automatically. Below is a production‐ready, battle-tested workflow using cert-manager and an Ingress:

## Prerequisites  
DNS: You have a publicly‐resolvable hostname (e.g. my-app.example.com) pointed at your cluster’s Ingress controller IP.

Cluster setup: You’re running a conformant Kubernetes cluster (GKE, EKS, AKS, bare-metal + ingress, etc.).

**helm** or **kubectl** access to install CRDs and components.


## Install cert-manager
[cert-manager](https://cert-manager.io/) is the de-facto standard for ACME certificate management in Kubernetes.

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install \
  cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.12.1 \
  --set installCRDs=true \
  --set global.leaderElection.namespace=cert-manager
```
Wait for the cert-manager to be ready.  

The cert-manager.yaml contains both the CRDs and the controller+webhook+CA‑injector. That CA‑injector will patch the webhook configurations with the proper CA bundle.  
After done, you can see `cert-manager` namespace and 3 container running inside it.


## Create a ClusterIssuer

```bash
kubectl apply -f server/k8s/letsencrypt-issuer.yaml
```

## Annotate your Ingress to request a Certificate

```bash
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  namespace: production
  annotations:
      kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: "letsencrypt-prod" # should match with letsencrypt-issuer.yaml -> spec.acme.privateKeySecretRef.name
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - my-app.example.com
      secretName: my-app-tls   # the secret is created automatically where cert-manager will store the cert
  rules:
    - host: my-app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-svc
                port:
                  number: 80
```