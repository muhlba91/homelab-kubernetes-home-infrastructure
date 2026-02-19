package certmanager

import (
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/lib/google/iam/role"
	"github.com/muhlba91/pulumi-shared-library/pkg/lib/vault/secret"
	slServiceAccount "github.com/muhlba91/pulumi-shared-library/pkg/util/google/iam/serviceaccount"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/gates"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// CreateResources creates the cert-manager resources.
// ctx: Pulumi context.
// gatesConfig: Configuration for gates.
// googleConfig: Configuration for Google Cloud.
// secretStoresConfig: Configuration for secret stores (Vault).
func CreateResources(
	ctx *pulumi.Context,
	gatesConfig *gates.Config,
	googleConfig *google.Config,
	secretStoresConfig *secretstores.Config,
) {
	if !gatesConfig.CertManager {
		return
	}

	name := fmt.Sprintf("cert-manager-%s-%s", config.GlobalName, config.Environment)

	roles := []string{"roles/dns.admin"}
	iam, err := slServiceAccount.CreateServiceAccountUser(ctx, &slServiceAccount.CreateOptions{
		Name:    name,
		Project: pulumi.String(googleConfig.Project),
	})
	if err != nil {
		log.Error().Err(err).Msg("[certmanager] failed to create service account user")
	}

	_, errMember := role.CreateMember(ctx, name, &role.MemberOptions{
		Member:  pulumi.Sprintf("serviceAccount:%s", iam.ServiceAccount.Email),
		Roles:   roles,
		Project: pulumi.String(googleConfig.DNSProject),
	})
	if errMember != nil {
		log.Error().Err(errMember).Msg("[certmanager] failed to create role member")
	}

	vaultValue, _ := (iam.Key.PrivateKey.ApplyT(func(key string) string {
		data, errMarshal := json.Marshal(map[string]string{
			"credentials": key,
		})
		if errMarshal != nil {
			log.Error().Err(errMarshal).Msg("[certmanager][vault] failed to marshal credentials")
		}
		return string(data)
	})).(pulumi.StringOutput)

	_, errVault := secret.Create(ctx, &secret.CreateOptions{
		Key:   "cert-manager-google-cloud",
		Value: vaultValue,
		Path:  secretStoresConfig.VaultMount,
	})
	if errVault != nil {
		log.Error().Err(errVault).Msg("[certmanager][vault] failed to create secret")
	}
}
