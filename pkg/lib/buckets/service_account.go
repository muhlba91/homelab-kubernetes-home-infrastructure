package buckets

import (
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog/log"

	giam "github.com/muhlba91/pulumi-shared-library/pkg/lib/google/storage/iam"
	"github.com/muhlba91/pulumi-shared-library/pkg/lib/vault/secret"
	gmodel "github.com/muhlba91/pulumi-shared-library/pkg/model/google/iam/serviceaccount"
	slServiceAccount "github.com/muhlba91/pulumi-shared-library/pkg/util/google/iam/serviceaccount"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// createServiceAccount creates a service account and stores its credentials in Vault.
// ctx: Pulumi context.
// name: The name of the bucket/service account.
// vaultPath: The vault path for storing secrets.
// bucketID: The bucket ID output.
// googleConfig: Configuration for Google Cloud.
// secretStoresConfig: Configuration for secret stores (Vault).
func createServiceAccount(
	ctx *pulumi.Context,
	name string,
	vaultPath string,
	bucketID pulumi.StringOutput,
	googleConfig *google.Config,
	secretStoresConfig *secretstores.Config,
) *gmodel.User {
	iam, err := slServiceAccount.CreateServiceAccountUser(ctx, &slServiceAccount.CreateOptions{
		Name:    fmt.Sprintf("%s-%s-%s", name, config.GlobalName, config.Environment),
		Project: pulumi.String(googleConfig.Project),
	})
	if err != nil {
		log.Error().Err(err).Msgf("[buckets][serviceaccount] failed to create service account user for %s", name)
	}

	_ = pulumi.All(bucketID, iam.ServiceAccount.Email).ApplyT(func(args []any) any {
		bID, ok := args[0].(string)
		if !ok {
			log.Error().Msgf("[buckets][serviceaccount] failed to cast bucketID for %s", name)
		}
		email, ok := args[1].(string)
		if !ok {
			log.Error().Msgf("[buckets][serviceaccount] failed to cast email for %s", name)
		}

		_, errMemberAdmin := giam.CreateIAMMember(ctx, &giam.MemberOptions{
			BucketID: bID,
			Member:   fmt.Sprintf("serviceAccount:%s", email),
			Role:     "roles/storage.objectAdmin",
		})
		if errMemberAdmin != nil {
			log.Error().
				Err(errMemberAdmin).
				Msgf("[buckets][serviceaccount] failed to create IAM member (objectAdmin) for %s", name)
		}
		_, errMemberOwner := giam.CreateIAMMember(ctx, &giam.MemberOptions{
			BucketID: bID,
			Member:   fmt.Sprintf("serviceAccount:%s", email),
			Role:     "roles/storage.legacyBucketOwner",
		})
		if errMemberOwner != nil {
			log.Error().
				Err(errMemberOwner).
				Msgf("[buckets][serviceaccount] failed to create IAM member (legacyBucketOwner) for %s", name)
		}
		return nil
	})

	vaultValue, _ := (pulumi.All(iam.Key.PrivateKey, bucketID).ApplyT(func(args []any) string {
		creds, ok := args[0].(string)
		if !ok {
			log.Error().Msgf("[buckets][serviceaccount] failed to cast creds for %s", name)
		}
		bID, ok := args[1].(string)
		if !ok {
			log.Error().Msgf("[buckets][serviceaccount] failed to cast bucketID for %s", name)
		}
		data, errMarshal := json.Marshal(map[string]string{
			"credentials": creds,
			"bucket":      bID,
		})
		if errMarshal != nil {
			log.Error().Err(errMarshal).Msgf("[buckets][serviceaccount][vault] failed to marshal credentials for %s", name)
		}
		return string(data)
	})).(pulumi.StringOutput)

	_, errVault := secret.Create(ctx, &secret.CreateOptions{
		Key:   fmt.Sprintf("%s-google-cloud", vaultPath),
		Value: vaultValue,
		Path:  secretStoresConfig.VaultMount,
	})
	if errVault != nil {
		log.Error().Err(errVault).Msgf("[buckets][serviceaccount][vault] failed to create secret for %s", name)
	}

	return iam
}
