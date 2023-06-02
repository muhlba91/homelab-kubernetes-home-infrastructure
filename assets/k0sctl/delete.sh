#! /bin/sh

set -e

while [ ! -f ./outputs/k0sctl.yaml ]; do sleep 5; done
while [ ! -f ./outputs/ssh.key ]; do sleep 5; done

k0sctl reset --config ./outputs/k0sctl.yml
