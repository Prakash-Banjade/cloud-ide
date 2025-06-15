In Kubernetes you almost never generate and manage TLS certificates inside each Pod—instead you terminate TLS at the edge (Ingress or service‐mesh) using certificates provisioned and renewed automatically. Below is a production‐ready, battle-tested workflow using cert-manager and an Ingress:

## Prerequisites  
DNS: You have a publicly‐resolvable hostname (e.g. my-app.example.com) pointed at your cluster’s Ingress controller IP.

Cluster setup: You’re running a conformant Kubernetes cluster (GKE, EKS, AKS, bare-metal + ingress, etc.).

helm or kubectl access to install CRDs and components.


## Install cert-manager
[cert-manager](https://cert-manager.io/) is the de-facto standard for ACME certificate management in Kubernetes.

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml
```
Wait for the cert-manager to be ready.  

The cert-manager.yaml contains both the CRDs and the controller+webhook+CA‑injector. That CA‑injector will patch the webhook configurations with the proper CA bundle.  


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
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - my-app.example.com
      secretName: my-app-tls   # where cert-manager will store the cert
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

---

## Issue you may face

White creating ClusterIssuer you may face issues that both the webhooks have an empty caBundle, the cert‑manager “CA injector” never ran (or failed). We need to manually inject the CA from the secret that the injector should have produced. Here’s how:

1. Get the CA from the webhook secret
Cert‑manager stores its webhook CA in a Secret called cert-manager-webhook-ca in the cert-manager namespace. Let’s extract it:

```bash
# Save the base64‑encoded CA bundle to a file
kubectl get secret cert-manager-webhook-ca \
  -n cert-manager \
  -o jsonpath="{.data.ca\.crt}" > C:\temp\ca-bundle.b64
```
You can open C:\temp\ca-bundle.b64 in Notepad to confirm it’s non-empty (a long base64 string).

2. Patch the webhook configurations with that CA

A) Validating webhook

```bash
# Read the CA into a variable
$ca = Get-Content C:\temp\ca-bundle.b64

# Patch the validating webhook
kubectl patch validatingwebhookconfiguration cert-manager-webhook `
  --type='json' `
  -p ("[{" +
       "'op':'replace'," +
       "'path':'/webhooks/0/clientConfig/caBundle'," +
       "'value':'" + $ca + "'" +
     "}]")
```

B) Mutating webhook

```bash
kubectl patch mutatingwebhookconfiguration cert-manager-webhook `
  --type='json' `
  -p ("[{" +
       "'op':'replace'," +
       "'path':'/webhooks/0/clientConfig/caBundle'," +
       "'value':'" + $ca + "'" +
     "}]")
```

3. Verify

```bash
kubectl get validatingwebhookconfiguration cert-manager-webhook -o jsonpath="{.webhooks[*].clientConfig.caBundle}"
kubectl get mutatingwebhookconfiguration cert-manager-webhook -o jsonpath="{.webhooks[*].clientConfig.caBundle}"
```

You should now see the same base64 string you extracted. With that in place, the API server will trust the webhook, and you can finally create the ClusterIssuer.

### Why this works
The cert‑manager CA injector normally populates those webhook configs for you.

On GKE (or other managed environments), that sometimes fails or is delayed.

Manually copying the ca.crt from the cert‑manager secret into the caBundle field gives the API server the trust it needs to call the webhook.