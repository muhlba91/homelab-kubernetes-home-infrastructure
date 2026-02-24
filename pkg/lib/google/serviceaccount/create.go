package serviceaccount

import (
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/lib/vault/secret"
	gmodel "github.com/muhlba91/pulumi-shared-library/pkg/model/google/iam/serviceaccount"
	slServiceAccount "github.com/muhlba91/pulumi-shared-library/pkg/util/google/iam/serviceaccount"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// createAccount creates a service account in GCP and stores the credentials in Vault.
// ctx: Pulumi context.
// name: The name of the bucket/service account.
// googleConfig: Configuration for Google Cloud.
// secretStoresConfig: Configuration for secret stores (Vault).
func createAccount(
	ctx *pulumi.Context,
	name string,
	googleConfig *google.Config,
	secretStoresConfig *secretstores.Config,
) *gmodel.User {
	iam, err := slServiceAccount.CreateServiceAccountUser(ctx, &slServiceAccount.CreateOptions{
		Name:    fmt.Sprintf("%s-%s-%s", name, config.GlobalName, config.Environment),
		Project: pulumi.String(googleConfig.Project),
	})
	if err != nil {
		log.Error().Err(err).Msgf("[google][serviceaccount] failed to create service account user for %s", name)
	}

	vaultValue, _ := (iam.Key.PrivateKey.ApplyT(func(creds string) string {
		data, errMarshal := json.Marshal(map[string]string{
			"credentials": creds,
		})
		if errMarshal != nil {
			log.Error().Err(errMarshal).Msgf("[google][serviceaccount][vault] failed to marshal credentials for %s", name)
		}
		return string(data)
	})).(pulumi.StringOutput)

	_, errVault := secret.Create(ctx, &secret.CreateOptions{
		Key:   fmt.Sprintf("%s-google-cloud", name),
		Value: vaultValue,
		Path:  secretStoresConfig.VaultMount,
	})
	if errVault != nil {
		log.Error().Err(errVault).Msgf("[google][serviceaccount][vault] failed to create secret for %s", name)
	}

	return iam
}
