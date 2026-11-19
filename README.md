# Homelab: Kubernetes Home Cluster - Infrastructure

[![Build status](https://img.shields.io/github/actions/workflow/status/muhlba91/homelab-kubernetes-home-infrastructure/pipeline.yml?style=for-the-badge)](https://github.com/muhlba91/homelab-kubernetes-home-infrastructure/actions/workflows/pipeline.yml)
[![License](https://img.shields.io/github/license/muhlba91/homelab-kubernetes-home-infrastructure?style=for-the-badge)](LICENSE.md)
[![](https://api.scorecard.dev/projects/github.com/muhlba91/homelab-kubernetes-home-infrastructure/badge?style=for-the-badge)](https://scorecard.dev/viewer/?uri=github.com/muhlba91/homelab-kubernetes-home-infrastructure)

This repository contains the infrastructure as code (IaC) for the `home-cluster` using [Pulumi](http://pulumi.com).

---

## Requirements

- [mise](https://mise.jdx.dev), which provides Go, Pulumi, talosctl, helm, flux and golangci-lint (see [Development](#development))

## Creating the Infrastructure

To create the infrastructure and deploy the cluster, a [Pulumi Stack](https://www.pulumi.com/docs/concepts/stack/) with the correct configuration needs to exist.

### Creating the Virtual Machine

The Talos node of the stack `hochschule-burgenland` (`hochschule-burgenland-cluster-001`) is a libvirt VM on the bare-metal NixOS router and hypervisor host of the site `hetzner-fra-router-001`. It is defined by `libvirt/hochschule-burgenland-cluster-001.yml`:

- 8 vCPUs, 38 GiB memory, MAC address `bc:24:11:fb:c4:df`
- three 128 GiB disks as zvols in the pool `guests`: `sda` is the Talos OS disk, `sdb` and `sdc` are the Ceph OSDs (Rook `deviceFilter` `^sd[bc]`)
- the Talos metal ISO of the stack's `installImageHash`, in the Talos version of the installer tag in `assets/talos/controlplane.yml.j2`, as installer image

Create the VM from a checkout of [homelab-router-infrastructure](https://github.com/muhlba91/homelab-router-infrastructure), in its `nix/` folder, with the site data set up as for `./router deploy`. The command creates missing disks, uploads the ISO, defines the VM, enables autostart and starts it. It is idempotent and deletes nothing. The tool is documented in `docs/libvirt.md` of that repository.

```bash
# create or update the VM from the spec
./router libvirt-deploy hetzner-fra-router-001 <path to libvirt/hochschule-burgenland-cluster-001.yml>

# print the domain XML without changing anything
./router libvirt-render <path to libvirt/hochschule-burgenland-cluster-001.yml>
```

The ISO boots Talos into maintenance mode.

### Deploying the Stack

With the VM running, the stack can be deployed via:

```bash
pulumi up
```

The program applies the machine config (`talosctl apply-config`), bootstraps the cluster and installs Cilium and Flux.

After the install, eject the ISO and remove `iso` from the spec (run the `./router` commands from `nix/` of the homelab-router-infrastructure checkout):

```bash
# eject the installer ISO from the running VM and its definition
./router virsh hetzner-fra-router-001 change-media hochschule-burgenland-cluster-001 sdz --eject --live --config
```

The console is a VNC display on `127.0.0.1` of the host only. Query its display number and tunnel the port over SSH to the host:

```bash
# print the VNC display of the VM
./router virsh hetzner-fra-router-001 vncdisplay hochschule-burgenland-cluster-001
```

```bash
# forward the VNC port (5900 plus the display number) to the workstation, then connect a VNC client to localhost:5900
ssh -N -L 5900:127.0.0.1:<5900 + display number> deploy@<management address of hetzner-fra-router-001>
```

### Recreating the Virtual Machine

If the VM is recreated with new disks for the same stack, create it again as above. `talosctl-apply` and `helm-cilium` are create-only Pulumi commands, so they need to be replaced:

```bash
# list the resource URNs
pulumi stack --show-urns

# replace the create-only commands
pulumi up --replace <URN of talosctl-apply> --replace <URN of helm-cilium>

# sync the state, then apply the rest
pulumi refresh
pulumi up
```

Check `cilium status` afterwards, as `assets/helm/install.sh` hides errors.

## Destroying the Infrastructure

The Pulumi resources can be destroyed via:

```bash
pulumi destroy
```

The VM is not managed by Pulumi and stays in place.

## Environment Variables

The program needs Google Cloud credentials (secrets encryption: Cloud KMS; Google Cloud resources), the Scaleway
variables (`SCW_*`), a Vault token (`VAULT_ADDR`, `VAULT_TOKEN`) and a Pulumi token. They come from Vault through
[fnox](https://fnox.jdx.dev) (`fnox.toml`, installed by mise), in CI and locally:

- **CI** (`FNOX_PROFILE=ci`): `hashicorp/vault-action` only logs in (GitHub OIDC, `exportToken`; Pulumi's Vault
  provider uses that token); fnox reads the values listed in `fnox.toml`, plus the runner's Tailscale login and Flux's
  GitHub token (`GH_PAT_TOKEN`). Pulumi logs in through OIDC (`pulumi/auth-actions`).
- **Locally** (`FNOX_PROFILE=dev`, set on the Mac by the dotfiles and on the dev VMs by NixOS): the Pulumi token,
  Google Cloud credentials impersonating the CI service account (built from the machine's own key,
  `GCP_SOURCE_CREDENTIALS` in the global fnox config), and a short-lived `VAULT_TOKEN` with this repository's CI
  policy, minted with the machine's Vault token through the token role `dev-infrastructure-repo-tokens` (the `vault`
  lease; reused for up to an hour).

```bash
fnox exec -- pulumi preview --stack vie
```

`fnox.local.toml` (git-ignored) can override values for experiments.

---

## Stacks

The following stacks are available:

- `vie`: identifies the cluster in Vienna
- `hochschule-burgenland`: identifies the Kubernetes cluster on a bare-metal router in Hetzner (Frankfurt)

---

## Configuration

The following section describes the configuration which must be set in the Pulumi Stack.

***Attention:*** do use [Secrets Encryption](https://www.pulumi.com/docs/concepts/secrets/#:~:text=Pulumi%20never%20sends%20authentication%20secrets,“secrets”%20for%20extra%20protection.) provided by Pulumi for secret values!

### Gates

```yaml
gates:
  homeAssistant: enables the Home Assistant integration
  externalDns: enables the External DNS integration
  certManager: enables the Cert Manager integration
  cluster: enables the cluster creation integration
```

### Bucket Identifiers

```yaml
bucketId: the bucket identifier to upload assets to
backupBucketId: the bucket identifier to configure backups to
```

### Secret Stores

```yaml
secretStores:
  vault: enables storing secrets to Vault
```

### S3 Buckets

```yaml
buckets:
  gcs: # map of bucket names to their configuration
    <name>:
      vaultPath: the Vault path to store the credentials at (optional)
      defaultName: the default name to create the bucket with (optional)
      defaultBucket: creates a new bucket with the same name (optional)
      mainBucket: uses the main bucket (optional)
      backupBucket: uses the backup bucket (optional)
```

### Passwords

```yaml
passwords:
  data: # map of Vault paths to the password entries stored at that path
    <vaultPath>:
      <vaultKey>: # map of keys to store within the secret at vaultPath
        length: the length of the password (optional)
        special: whether to include special characters (optional)
        password: a literal password value to use instead of generating one (optional)
```

Multiple `<vaultKey>` entries under the same `<vaultPath>` are merged into a single Vault secret object, e.g. setting `example-path.token.length: 16` and `example-path.credential.length: 32` writes one Vault secret at `example-path` containing both a `token` and a `credential` key.

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
    network:
      podSubnets:
        v4: the IPv4 pod subnet
        v6: the IPv6 pod subnet
      serviceSubnets:
        v4: the IPv4 service subnet
        v6: the IPv6 service subnet
  machine:
    disk: the disk to install to
    hostname: the hostname to set
    network:
      ip:
        v4: the IPv4 address to set
        v6: the IPv6 address to set
      mac: the network link's MAC address to set the IPs for
```

### Cluster Integration

```yaml
clusterIntegration:
  kubeconfig: the kubeconfig to use for the cluster integration
```

---

## Development

Tool versions (Go, golangci-lint, Pulumi, talosctl, helm, flux) are managed with [mise](https://mise.jdx.dev): run `mise trust` and `mise install` once, then use the usual commands (`make ...`, `go test ./...`).

---

## Continuous Integration and Automations

- [GitHub Actions](https://docs.github.com/en/actions) are linting, and verifying the code.
- [Renovate Bot](https://github.com/renovatebot/renovate) is updating Go modules, and GitHub Actions.
