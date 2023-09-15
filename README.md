# Homelab: Kubernetes Home Cluster - Infrastructure

[![Build status](https://img.shields.io/github/actions/workflow/status/muhlba91/homelab-kubernetes-home-infrastructure/pipeline.yml?style=for-the-badge)](https://github.com/muhlba91/homelab-kubernetes-home-infrastructure/actions/workflows/pipeline.yml)
[![License](https://img.shields.io/github/license/muhlba91/homelab-kubernetes-home-infrastructure?style=for-the-badge)](LICENSE.md)

This repository contains the infrastructure as code (IaC) for the `home-cluster` using [Pulumi](http://pulumi.com).

---

## Requirements

- [NodeJS](https://nodejs.org/en), and [yarn](https://yarnpkg.com)
- [Pulumi](https://www.pulumi.com/docs/install/)
- [k0sctl](https://github.com/k0sproject/k0sctl)

## Creating the Infrastructure

To create the infrastructure and deploy the cluster, a [Pulumi Stack](https://www.pulumi.com/docs/concepts/stack/) with the correct configuration needs to exists.

The stack can be deployed via:

```bash
yarn install
yarn build; pulumi up
```

## Destroying the Infrastructure

The entire infrastructure can be destroyed via:

```bash
yarn install
yarn build; pulumi destroy
```

## Environment Variables

To successfully run, and configure the Pulumi plugins, you need to set a list of environment variables. Alternatively, refer to the used Pulumi provider's configuration documentation.

- `CLOUDSDK_CORE_PROJECT`: the Google Cloud (GCP) project
- `CLOUDSDK_COMPUTE_REGION` the Google Cloud (GCP) region
- `GOOGLE_APPLICATION_CREDENTIALS`: reference to a file containing the Google Cloud (GCP) service account credentials
- `DOPPLER_TOKEN`: the Doppler access token (not a project token!)
- `GITHUB_TOKEN`: the GitHub Personal Access Token (PAT)
- `PROXMOX_VE_USERNAME`: the Proxmox username
- `PROXMOX_VE_PASSWORD`: the Proxmox password
- `PROXMOX_VE_ENDPOINT`: the endpoint to connect to Proxmox
- `PROXMOX_VE_INSECURE`: turn on/off insecure connections to Proxmox

---

## Configuration

The following section describes the configuration which must be set in the Pulumi Stack.

***Attention:*** do use [Secrets Encryption](https://www.pulumi.com/docs/concepts/secrets/#:~:text=Pulumi%20never%20sends%20authentication%20secrets,“secrets”%20for%20extra%20protection.) provided by Pulumi for secret values!

### ArgoCD

[ArgoCD](https://argo-cd.readthedocs.io/en/stable/) is deployed to support [GitOps](http://opengitops.dev) style deployments of applications.

```yaml
argocd:
  applicationsRepository:
    branch: the branch to use
    repository: the GitHub repository containing the applications
  valuesRepository:
    branch: the branch to use
    repository: the GitHub repository containing the application value files
```

### Bucket Identifier

```yaml
bucketId: the bucket identifier to upload assets to
```

### Cluster

The cluster exists from created Proxmox KVM servers.

```yaml
cluster:
  name: the cluster name
  nodes: a map of servers to create in Promxox
    <NODE_NAME>:
      cpu: the CPU allocation
      diskSize: the disk size to use
      memory: memory configuration (enables or disables ballooning automatically)
        min: the minimum memory to assign
        max: the maximum memory to assign
      host: the Proxmox host to create the node on
      ipv4Address: the internal IPv4 address
      ipv6Address: the internal IPv6 address (optional)
      roles: a list of all k0s roles (the first one is chosen!)
      labels: a map of Kubernetes node labels to apply
```

### Google Cloud (GCP)

ArgoCD deployed applications can reference secrets being encrypted with [sops](https://github.com/mozilla/sops).
We need to specify, and allow access to this encryption stored in [Google KMS](https://cloud.google.com/security-key-management).

```yaml
gcp:
  project: the GCP project to create all resources in
  encryptionKey: references the sops encryption key
    cryptoKeyId: the CryptoKey identifier
    keyringId: the KeyRing identifier
    location: the location of the key
```

### Network

General configuration about the local network.

```yaml
network:
  domain: the internal DNS domain
  ipv4:
    cidrMask: the CIDR mask of the internal network
    enabled: enables IPv4 networking
    gateway: the IPv4 gateway
  ipv6:
    cidrMask: the CIDR mask of the internal network
    enabled: enables IPv6 networking
    gateway: the IPv6 gateway
  nameservers: a list of all nameservers to set (IPv4, IPv6)
```

### Proxmox VE (pve)

General configuration about the Proxmox environment.

***Attention:*** you must download the specifief `imageName` to each Proxmox host!

```yaml
pve:
  cpuType: the default CPU type to assign to machines
  imageName: the reference to the locally installed image
  localStoragePool: the storage pool used for snippets
  networkBridge: the network bridge to use for server connectivity
  storagePool: the storage pool used for machine disks
```

### k0s

[k0s](http://k0sproject.io) is used as the Kubernetes distribution.
Additionally, the initial [ArgoCD App-of-Apps Application](https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/) is created, and [Cilium](http://cilium.io) as the CNI installed.

```yaml
k0s:
  version: the k0s Kubernetes version
  argocdApps:
    enabled: enables automated sync for the applications
    version: the version of the argocd-apps Helm chart to deploy
  cilium:
    enabled: enables deployment of cilium
    version: the version of the argocd-apps Helm chart to deploy initially
```

### Username

```yaml
username: the username to use for interacting with the servers
```

### SSH

The SSH key needs to be specified especially for the external nodes, and for all operations to be able to connect to these servers.

```yaml
ssh:
  privateKey: the SSH private key to provision/use
  publicKey: the SSH public key to use
```

### UFW

```yaml
ufw:
  enabled: turns on/off provisioning of the UFW in the inventory.yml file
```

---

## Continuous Integration and Automations

- [GitHub Actions](https://docs.github.com/en/actions) are linting, and verifying the code.
- [Renovate Bot](https://github.com/renovatebot/renovate) is updating NodeJS packages, and GitHub Actions.
