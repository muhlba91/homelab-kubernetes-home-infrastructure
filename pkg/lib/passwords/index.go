package passwords

import (
	"encoding/json"
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/lib/random"
	"github.com/muhlba91/pulumi-shared-library/pkg/lib/vault/secret"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/defaults"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/password"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

const (
	defaultPasswordLength   = 16
	defaultsPasswordSpecial = true
)

// Create creates the password resources.
// ctx: Pulumi context.
// passwordsConfig: Configuration for passwords.
// secretStoresConfig: Configuration for secret stores (Vault).
func Create(
	ctx *pulumi.Context,
	passwordsConfig *password.Config,
	secretStoresConfig *secretstores.Config,
) {
	for name, config := range passwordsConfig.Data {
		opts := &random.PasswordOptions{
			Length:  defaults.GetOrDefault(config.Length, defaultPasswordLength),
			Special: defaults.GetOrDefault(config.Special, defaultsPasswordSpecial),
		}

		pw, err := random.CreatePassword(ctx, fmt.Sprintf("password-%s", name), opts)
		if err != nil {
			log.Error().Err(err).Msgf("[passwords] failed to create password for %s", name)
		}

		vaultPath := name
		if config.VaultPath != nil {
			vaultPath = *config.VaultPath
		}

		vaultKey := "password"
		if config.VaultKey != nil {
			vaultKey = *config.VaultKey
		}

		vaultValue, _ := (pw.Password.ApplyT(func(passwd string) string {
			data, errMarshal := json.Marshal(map[string]string{
				vaultKey: passwd,
			})
			if errMarshal != nil {
				log.Error().Err(errMarshal).Msgf("[passwords][vault] failed to marshal password for %s", name)
			}
			return string(data)
		})).(pulumi.StringOutput)

		_, errVault := secret.Create(ctx, &secret.CreateOptions{
			Key:   vaultPath,
			Value: vaultValue,
			Path:  secretStoresConfig.VaultMount,
		})
		if errVault != nil {
			log.Error().Err(errVault).Msgf("[passwords][vault] failed to create secret for %s", name)
		}
	}
}
