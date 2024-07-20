#! /bin/sh

set -e

# wait for all files to exist
while [ ! -f ./outputs/controlplane.yml ]; do sleep 5; done
while [ ! -f ./outputs/talosconfig ]; do sleep 5; done

# install talos
talosctl apply-config --insecure --nodes ${CONTROL_PLANE_IP} --file ./outputs/controlplane.yml
sleep 120

# bootstrap talos
TALOSCONFIG="./outputs/talosconfig" talosctl bootstrap
sleep 90

# get kubeconfig
TALOSCONFIG="./outputs/talosconfig" talosctl kubeconfig ./outputs/kubeconfig

# wait for nodes to appear
while test "$(kubectl --kubeconfig ./outputs/kubeconfig get node | grep NotReady | wc -l)" -lt "1"; do sleep 10; done

# approve all CSRs
kubectl --kubeconfig ./outputs/kubeconfig get csr -o go-template='{{range .items}}{{if not .status}}{{.metadata.name}}{{"\n"}}{{end}}{{end}}' | xargs --no-run-if-empty kubectl --kubeconfig ./outputs/kubeconfig certificate approve

# wait for some reconciliation
sleep 15
