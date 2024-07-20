#! /bin/sh

set -e

# wait for all files to exist
while [ ! -f ./outputs/talosconfig ]; do sleep 5; done

# upgrade kubernetes
TALOSCONFIG="./outputs/talosconfig" talosctl --nodes ${CONTROL_PLANE_IP} upgrade-k8s --to ${KUBERNETES_VERSION}
sleep 300
