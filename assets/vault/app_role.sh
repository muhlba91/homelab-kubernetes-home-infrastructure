#!/bin/sh

vault login

# create a policy for the kubernetes-home-cluster-external-secrets role
vault policy write kubernetes-home-cluster-external-secrets -<<EOF
path "kubernetes-home-cluster/*" {
  capabilities = ["read", "list"]
}
path "kubernetes-home-cluster-muc/*" {
  capabilities = ["read", "list"]
}
EOF

# create a role for the kubernetes-home-cluster-external-secrets
vault write auth/approle/role/kubernetes-home-cluster-external-secrets \
    token_policies="kubernetes-home-cluster-external-secrets" \
    secret_id_num_uses=0 \
    secret_id_ttl=0 \
    token_num_uses=0 \
    token_ttl=1h \
    token_max_ttl=4h

# get the role id and secret id for the kubernetes-home-cluster-external-secrets role
vault read auth/approle/role/kubernetes-home-cluster-external-secrets/role-id
vault write -f auth/approle/role/kubernetes-home-cluster-external-secrets/secret-id
