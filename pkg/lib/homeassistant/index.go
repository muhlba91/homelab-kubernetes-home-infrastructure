package homeassistant

import (
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/lib/google/kms/iam"
	"github.com/muhlba91/pulumi-shared-library/pkg/lib/vault/secret"
	gmodel "github.com/muhlba91/pulumi-shared-library/pkg/model/google/iam/serviceaccount"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/gates"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// CreateResources creates the Home Assistant resources.
// ctx: Pulumi context.
// gatesConfig: Configuration for gates.
// googleConfig: Configuration for Google Cloud.
// secretStoresConfig: Configuration for secret stores (Vault).
// iamUser: The service account data for Home Assistant.
func CreateResources(
	ctx *pulumi.Context,
	gatesConfig *gates.Config,
	googleConfig *google.Config,
	secretStoresConfig *secretstores.Config,
	iamUser *gmodel.User,
) {
	if !gatesConfig.HomeAssistant || iamUser == nil {
		return
	}

	iamUser.ServiceAccount.Email.ApplyT(func(email string) any {
		_, err := iam.CreateMember(ctx, &iam.MemberOptions{
			CryptoKeyID: fmt.Sprintf(
				"%s/%s/%s",
				googleConfig.EncryptionKey.Location,
				googleConfig.EncryptionKey.KeyringID,
				googleConfig.EncryptionKey.CryptoKeyID,
			),
			Member: fmt.Sprintf("serviceAccount:%s", email),
			Role:   "roles/cloudkms.cryptoKeyEncrypterDecrypter",
		})
		if err != nil {
			log.Error().Err(err).Msgf("[homeassistant][backup] failed to create KMS IAM member for %s", email)
		}
		return nil
	})

	vaultValue, err := json.Marshal(map[string]string{
		"bucket_name":      config.BackupBucketID,
		"bucket_path":      fmt.Sprintf("%s/home-assistant", config.BucketPath),
		"bucket_reference": fmt.Sprintf("%s/%s/home-assistant", config.BackupBucketID, config.BucketPath),
	})
	if err != nil {
		log.Error().Err(err).Msg("[homeassistant][backup][vault] failed to marshal backup configuration")
	}

	_, errVault := secret.Create(ctx, &secret.CreateOptions{
		Key:   "home-assistant-backup-configuration",
		Value: pulumi.String(vaultValue),
		Path:  secretStoresConfig.VaultMount,
	})
	if errVault != nil {
		log.Error().Err(errVault).Msg("[homeassistant][backup][vault] failed to create secret")
	}
}
