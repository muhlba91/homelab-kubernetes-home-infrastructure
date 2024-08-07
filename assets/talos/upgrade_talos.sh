#! /bin/sh

set -e

# wait for all files to exist
while [ ! -f ./outputs/talosconfig ]; do sleep 5; done

# upgrade talos
TALOSCONFIG="./outputs/talosconfig" talosctl upgrade --nodes ${CONTROL_PLANE_IP} --image factory.talos.dev/installer/${INSTALL_IMAGE_HASH}:${TALOS_VERSION} --preserve
sleep 300
