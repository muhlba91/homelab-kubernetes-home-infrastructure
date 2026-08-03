#!/bin/sh
set -eu

# RUN BEFORE EXECUTING:
# vault login

# list of cluster names to provision
CLUSTERS="home-cluster hochschule-burgenland-cluster"

for cluster in $CLUSTERS; do
    role_name="kubernetes-${cluster}-external-secrets"

    echo "=== Setting up ${role_name} ==="

    # create a policy for the role
    vault policy write "${role_name}" -<<EOF
path "kubernetes-${cluster}/*" {
  capabilities = ["read", "list"]
}
EOF

    # create the approle role
    vault write "auth/approle/role/${role_name}" \
        token_policies="${role_name}" \
        secret_id_num_uses=0 \
        secret_id_ttl=0 \
        token_num_uses=0 \
        token_ttl=1h \
        token_max_ttl=4h

    # get the role id and secret id
    vault read "auth/approle/role/${role_name}/role-id"
    vault write -f "auth/approle/role/${role_name}/secret-id"

    echo
done