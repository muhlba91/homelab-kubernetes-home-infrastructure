package flux

import (
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/lib/google/kms/iam"
	slServiceAccount "github.com/muhlba91/pulumi-shared-library/pkg/util/google/iam/serviceaccount"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
)

// createFluxServiceAccount creates the ksops resources.
// ctx: Pulumi context.
// googleConfig: Configuration for Google Cloud.
func createFluxServiceAccount(
	ctx *pulumi.Context,
	googleConfig *google.Config,
) pulumi.StringOutput {
	iamUser, errUser := slServiceAccount.CreateServiceAccountUser(ctx, &slServiceAccount.CreateOptions{
		Name:    fmt.Sprintf("flux-%s-%s", config.GlobalName, config.Environment),
		Project: pulumi.String(googleConfig.Project),
	})
	if errUser != nil {
		log.Error().Err(errUser).Msg("[flux][serviceaccount] failed to create service account user")
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
			log.Error().Err(err).Msgf("[flux][serviceaccount] failed to create KMS IAM member for %s", email)
		}
		return nil
	})

	return iamUser.Key.PrivateKey
}
