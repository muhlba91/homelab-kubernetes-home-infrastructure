#! /bin/sh

set -e

# wait for all files to exist
while [ ! -f ./outputs/${ENVIRONMENT}/controlplane.yml ]; do sleep 5; done
while [ ! -f ./outputs/${ENVIRONMENT}/talosconfig ]; do sleep 5; done

# install talos
talosctl apply-config --insecure --nodes ${CONTROL_PLANE_IP} --file ./outputs/${ENVIRONMENT}/controlplane.yml
sleep 120

# bootstrap talos
TALOSCONFIG="./outputs/${ENVIRONMENT}/talosconfig" talosctl bootstrap
sleep 90

# get kubeconfig
TALOSCONFIG="./outputs/${ENVIRONMENT}/talosconfig" talosctl kubeconfig ./outputs/${ENVIRONMENT}/kubeconfig

# wait for nodes to appear
while test "$(kubectl --kubeconfig ./outputs/${ENVIRONMENT}/kubeconfig get node | grep NotReady | wc -l)" -lt "1"; do sleep 10; done

# approve all CSRs
kubectl --kubeconfig ./outputs/${ENVIRONMENT}/kubeconfig get csr -o go-template='{{range .items}}{{if not .status}}{{.metadata.name}}{{"\n"}}{{end}}{{end}}' | xargs --no-run-if-empty kubectl --kubeconfig ./outputs/${ENVIRONMENT}/kubeconfig certificate approve

# apply workaround for discovery service
kubectl --kubeconfig ./outputs/${ENVIRONMENT}/kubeconfig create clusterrolebinding manual-system-node-crb --user system:node:home-cluster-001 --clusterrole system:node

# wait for some reconciliation
sleep 15
