package gcs

import (
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog/log"

	giam "github.com/muhlba91/pulumi-shared-library/pkg/lib/google/storage/iam"
	"github.com/muhlba91/pulumi-shared-library/pkg/lib/vault/secret"
	gmodel "github.com/muhlba91/pulumi-shared-library/pkg/model/google/iam/serviceaccount"
	gcpStorage "github.com/pulumi/pulumi-gcp/sdk/v9/go/gcp/storage"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// createHmacKey creates an HMAC key for the service account and stores it in Vault.
// ctx: Pulumi context.
// vaultPath: The vault path for storing secrets.
// bucketID: The bucket ID output.
// iam: The service account user.
// googleConfig: Configuration for Google Cloud.
// secretStoresConfig: Configuration for secret stores (Vault).
func createHmacKey(
	ctx *pulumi.Context,
	vaultPath string,
	bucketID pulumi.StringOutput,
	iam *gmodel.User,
	googleConfig *google.Config,
	secretStoresConfig *secretstores.Config,
) {
	hmacKey := iam.ServiceAccount.Email.ApplyT(func(email string) *gcpStorage.HmacKey {
		key, err := giam.CreateHmacKey(ctx, &giam.HmacKeyOptions{
			ServiceAccount: email,
			Project:        pulumi.String(googleConfig.Project),
		})
		if err != nil {
			log.Error().Err(err).Msgf("[buckets][gcs][hmac] failed to create HMAC key for %s", email)
		}
		return key
	})

	vaultStorageValue, _ := (pulumi.All(hmacKey, bucketID).ApplyT(func(args []any) pulumi.StringOutput {
		key, ok := args[0].(*gcpStorage.HmacKey)
		if !ok {
			log.Error().Msgf("[buckets][gcs][hmac] failed to cast hmacKey for %s", vaultPath)
		}
		bID, ok := args[1].(string)
		if !ok {
			log.Error().Msgf("[buckets][gcs][hmac] failed to cast bucketID for %s", vaultPath)
		}

		output, _ := (pulumi.All(key.AccessId, key.Secret).ApplyT(func(keys []any) string {
			accessKey, okAccess := keys[0].(string)
			if !okAccess {
				log.Error().Msgf("[buckets][gcs][hmac] failed to cast accessKey for %s", vaultPath)
			}
			secretKey, okSecret := keys[1].(string)
			if !okSecret {
				log.Error().Msgf("[buckets][gcs][hmac] failed to cast secretKey for %s", vaultPath)
			}

			data, err := json.Marshal(map[string]string{
				"access_key_id":     accessKey,
				"secret_access_key": secretKey,
				"bucket":            bID,
			})
			if err != nil {
				log.Error().Err(err).Msgf("[buckets][gcs][hmac][vault] failed to marshal credentials for %s", vaultPath)
			}
			return string(data)
		})).(pulumi.StringOutput)
		return output
	})).(pulumi.StringOutput)

	_, errVault := secret.Create(ctx, &secret.CreateOptions{
		Key:   fmt.Sprintf("%s-google-cloud-storage", vaultPath),
		Value: vaultStorageValue,
		Path:  secretStoresConfig.VaultMount,
	})
	if errVault != nil {
		log.Error().Err(errVault).Msgf("[buckets][gcs][hmac][vault] failed to create secret for %s", vaultPath)
	}
}
