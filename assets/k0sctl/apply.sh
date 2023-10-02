#! /bin/sh

set -e

while [ ! -f ./outputs/k0sctl.yml ]; do sleep 5; done
while [ ! -f ./outputs/ssh.key ]; do sleep 5; done

k0sctl apply --no-drain --config ./outputs/k0sctl.yml
