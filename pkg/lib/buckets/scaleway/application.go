package scaleway

import (
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/lib/scaleway/iam/policy"
	"github.com/muhlba91/pulumi-shared-library/pkg/lib/vault/secret"
	smodel "github.com/muhlba91/pulumi-shared-library/pkg/model/scaleway/iam/application"
	slApplication "github.com/muhlba91/pulumi-shared-library/pkg/util/scaleway/iam/application"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumiverse/pulumi-scaleway/sdk/go/scaleway/iam"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/scaleway"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

const bucketPermission = "ObjectStorageFullAccess"

// createApplication creates an application and stores its credentials in Vault.
// ctx: Pulumi context.
// name: The name of the bucket/service account.
// vaultPath: The vault path for storing secrets.
// bucketID: The bucket ID output.
// scalewayConfig: Configuration for Scaleway.
// secretStoresConfig: Configuration for secret stores (Vault).
func createApplication(
	ctx *pulumi.Context,
	name string,
	vaultPath string,
	bucketID pulumi.StringOutput,
	scalewayConfig *scaleway.Config,
	secretStoresConfig *secretstores.Config,
) *smodel.Application {
	resourceName := fmt.Sprintf("%s-cluster-%s-%s", config.GlobalName, config.Environment, name)

	app, err := slApplication.CreateApplication(ctx, &slApplication.CreateOptions{
		Name:             resourceName,
		DefaultProjectID: pulumi.String(scalewayConfig.Project),
	})
	if err != nil {
		log.Error().Err(err).Msgf("[buckets][scaleway][application] failed to create application for %s", name)
	}

	rules := []iam.PolicyRuleInput{
		&iam.PolicyRuleArgs{
			ProjectIds:         pulumi.ToStringArray([]string{scalewayConfig.Project}),
			PermissionSetNames: pulumi.ToStringArray([]string{bucketPermission}),
		},
	}

	_, errPolicy := policy.Create(ctx, resourceName, &policy.CreateOptions{
		Name: pulumi.Sprintf("scw-iam-policy-%s", resourceName),
		Description: pulumi.Sprintf(
			"Policy for the home-cluster: %s",
			config.Environment,
		),
		Rules:         rules,
		ApplicationID: app.Application.ID(),
	})
	if errPolicy != nil {
		log.Error().
			Err(errPolicy).
			Msgf("[buckets][scaleway][application] failed to create IAM policy for %s", name)
	}

	vaultValue, _ := (pulumi.All(app.Key.AccessKey, app.Key.SecretKey, bucketID).ApplyT(func(args []any) string {
		accessKey, ok := args[0].(string)
		if !ok {
			log.Error().Msgf("[buckets][scaleway][application] failed to cast access key for %s", name)
		}
		secretKey, ok := args[1].(string)
		if !ok {
			log.Error().Msgf("[buckets][scaleway][application] failed to cast secret key for %s", name)
		}
		bID, ok := args[2].(string)
		if !ok {
			log.Error().Msgf("[buckets][scaleway][application] failed to cast bucketID for %s", name)
		}
		data, errMarshal := json.Marshal(map[string]string{
			"access_key":      accessKey,
			"secret_key":      secretKey,
			"organization_id": scalewayConfig.OrganizationID,
			"project_id":      scalewayConfig.Project,
			"region":          config.ScalewayDefaultRegion,
			"bucket":          bID,
		})
		if errMarshal != nil {
			log.Error().Err(errMarshal).Msgf("[buckets][scaleway][application][vault] failed to marshal credentials for %s", name)
		}
		return string(data)
	})).(pulumi.StringOutput)

	_, errVault := secret.Create(ctx, &secret.CreateOptions{
		Key:   fmt.Sprintf("%s-scaleway", vaultPath),
		Value: vaultValue,
		Path:  secretStoresConfig.VaultMount,
	})
	if errVault != nil {
		log.Error().Err(errVault).Msgf("[buckets][scaleway][application][vault] failed to create secret for %s", name)
	}

	return app
}
