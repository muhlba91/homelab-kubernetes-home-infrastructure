#! /bin/sh

set -e

# wait for all files to exist
while [ ! -f ./outputs/talosconfig ]; do sleep 5; done

# upgrade talos
TALOSCONFIG="./outputs/talosconfig" talosctl upgrade --nodes ${CONTROL_PLANE_IP} --image ${INSTALL_IMAGE} --preserve
sleep 300
