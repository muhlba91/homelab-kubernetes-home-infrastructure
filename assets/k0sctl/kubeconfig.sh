#! /bin/sh

set -e

while [ ! -f ./outputs/k0sctl.yml ]; do sleep 5; done
while [ ! -f ./outputs/ssh.key ]; do sleep 5; done

k0sctl kubeconfig --config ./outputs/k0sctl.yml > ./outputs/admin.conf
