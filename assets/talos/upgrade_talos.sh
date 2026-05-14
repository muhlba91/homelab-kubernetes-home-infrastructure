#! /bin/sh

set -e

# wait for all files to exist
while [ ! -f ./outputs/${ENVIRONMENT}/talosconfig ]; do sleep 5; done

# upgrade talos
TALOSCONFIG="./outputs/${ENVIRONMENT}/talosconfig" talosctl upgrade --nodes ${CONTROL_PLANE_IP} --image factory.talos.dev/metal-installer/${INSTALL_IMAGE_HASH}:${TALOS_VERSION} --timeout=1h0m0s --reboot-mode=force
sleep 300
