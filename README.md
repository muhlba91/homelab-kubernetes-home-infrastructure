# Homelab: Kubernetes Home Cluster - Infrastructure

[![Build status](https://img.shields.io/github/actions/workflow/status/muhlba91/homelab-kubernetes-home-infrastructure/pipeline.yml?style=for-the-badge)](https://github.com/muhlba91/homelab-kubernetes-home-infrastructure/actions/workflows/pipeline.yml)
[![License](https://img.shields.io/github/license/muhlba91/homelab-kubernetes-home-infrastructure?style=for-the-badge)](LICENSE.md)
[![](https://api.scorecard.dev/projects/github.com/muhlba91/homelab-kubernetes-home-infrastructure/badge?style=for-the-badge)](https://scorecard.dev/viewer/?uri=github.com/muhlba91/homelab-kubernetes-home-infrastructure)

This repository contains the infrastructure as code (IaC) for the `home-cluster` using [Pulumi](http://pulumi.com).

---

## Requirements

- [NodeJS](https://nodejs.org/en), and [yarn](https://yarnpkg.com)
- [Pulumi](https://www.pulumi.com/docs/install/)
- [talosctl](https://github.com/siderolabs/talos)

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
- `GITHUB_TOKEN`: the GitHub Personal Access Token (PAT)

---

## Configuration

The following section describes the configuration which must be set in the Pulumi Stack.

***Attention:*** do use [Secrets Encryption](https://www.pulumi.com/docs/concepts/secrets/#:~:text=Pulumi%20never%20sends%20authentication%20secrets,“secrets”%20for%20extra%20protection.) provided by Pulumi for secret values!

### Bucket Identifiers

```yaml
bucketId: the bucket identifier to upload assets to
backupBackedId: the bucket identifier to configure backups to
```

### Secret Stores

```yaml
secretStores:
  vault: enables storing secrets to Vault
```

### Google Cloud

Flux deployed applications can reference secrets being encrypted with [sops](https://github.com/mozilla/sops).
We need to specify, and allow access to this encryption stored in [Google KMS](https://cloud.google.com/security-key-management).

```yaml
google:
  project: the GCP project to create all resources in
  encryptionKey: references the sops encryption key
    cryptoKeyId: the CryptoKey identifier
    keyringId: the KeyRing identifier
    location: the location of the key
```

### Network

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

### Talos

[talos](http://talos.dev) is used as the Kubernetes distribution.
Additionally, [Cilium](http://cilium.io) as the CNI is installed.

```yaml
talos:
  cluster:
    installImageHash: the install image hash to use for deployment and updates
    vip: the virtual IP address to expose for the control plane
    revision: the current revision of the cluster (necessary if a full restore needs to happen)
  machine:
    disk: the disk to install to
    hostname: the hostname to set
    network:
      ip:
        v4: the IPv4 address to set
        v6: the IPv6 address to set
      mac: the network link's MAC address to set the IPs for

```

### Home Assistant

```yaml
homeAssistant:
  athena:
    bytesScannedCutoffPerQuery: the upper data usage limit (cutoff) for the amount of bytes a single query in a workgroup is allowed to scan
    resultsExpiryInDays: expiry time for cached results
  bucketArn: the bucket to store the Home Assistant date in
  firehose:
    buffer:
      interval: the flush interval of the Firehose buffer
      size: the flush size of the Firehose buffer
    compression: the compression to use when delivering data
    lambda:
      buffer:
        interval: the flush interval of the Firehose Lambda processor buffer
        size: the flush size of the Firehose Lambda processor buffer
      memory: the memory to assign to the Lambda processor
      timeout: the timeout for the Lambda processor
  glue:
    schedule: the cron schedule for the Glue indexing
```

---

## Continuous Integration and Automations

- [GitHub Actions](https://docs.github.com/en/actions) are linting, and verifying the code.
- [Renovate Bot](https://github.com/renovatebot/renovate) is updating NodeJS packages, and GitHub Actions.
