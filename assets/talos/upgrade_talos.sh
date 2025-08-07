#! /bin/sh

set -e

# wait for all files to exist
while [ ! -f ./outputs/${ENVIRONMENT}/talosconfig ]; do sleep 5; done

# upgrade talos
TALOSCONFIG="./outputs/${ENVIRONMENT}/talosconfig" talosctl upgrade --nodes ${CONTROL_PLANE_IP} --image factory.talos.dev/installer/${INSTALL_IMAGE_HASH}:${TALOS_VERSION} --preserve --timeout=1h0m0s --force
sleep 300
