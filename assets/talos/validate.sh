#! /bin/sh

set -e

# wait for all files to exist
while [ ! -f ./outputs/${ENVIRONMENT}/controlplane.yml ]; do sleep 5; done

# validate talos config
talosctl validate --mode metal --strict --config ./outputs/${ENVIRONMENT}/controlplane.yml
