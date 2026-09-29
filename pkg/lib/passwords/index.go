package passwords

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"

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
) error {
	if err := validate(passwordsConfig); err != nil {
		return err
	}

	for vaultPath, entries := range passwordsConfig.Data {
		keys := make([]string, 0, len(entries))
		for vaultKey := range entries {
			keys = append(keys, vaultKey)
		}
		sort.Strings(keys)

		values := make([]any, 0, len(keys))
		for _, vaultKey := range keys {
			values = append(values, createPasswordValue(ctx, vaultPath, vaultKey, entries[vaultKey]))
		}

		vaultValue, _ := pulumi.All(values...).ApplyT(func(args []any) string {
			data := make(map[string]string, len(keys))
			for i, vaultKey := range keys {
				passwd, ok := args[i].(string)
				if !ok {
					log.Error().Msgf("[passwords][vault] failed to cast password for %s/%s", vaultPath, vaultKey)
				}
				data[vaultKey] = passwd
			}

			marshaled, errMarshal := json.Marshal(data)
			if errMarshal != nil {
				log.Error().Err(errMarshal).Msgf("[passwords][vault] failed to marshal passwords for %s", vaultPath)
			}
			return string(marshaled)
		}).(pulumi.StringOutput)

		_, errVault := secret.Create(ctx, &secret.CreateOptions{
			Key:   vaultPath,
			Value: vaultValue,
			Path:  secretStoresConfig.VaultMount,
		})
		if errVault != nil {
			log.Error().Err(errVault).Msgf("[passwords][vault] failed to create secret for %s", vaultPath)
		}
	}

	return nil
}

// validate checks that no entry mixes a provided password with generation options.
// passwordsConfig: Configuration for passwords.
func validate(passwordsConfig *password.Config) error {
	var errs []error
	for vaultPath, entries := range passwordsConfig.Data {
		for vaultKey, config := range entries {
			if config == nil || config.Password == nil || *config.Password == "" {
				continue
			}
			if config.Length != nil || config.Special != nil || config.Prefix != nil {
				errs = append(errs, fmt.Errorf(
					"[passwords] %s/%s: 'password' cannot be combined with 'length', 'special' or 'prefix'",
					vaultPath,
					vaultKey,
				))
			}
		}
	}
	return errors.Join(errs...)
}

// createPasswordValue returns the password value for a single Vault path/key entry.
// ctx: Pulumi context.
// vaultPath: Vault path the password will be stored at.
// vaultKey: key within the Vault path the password will be stored at.
// config: Configuration for the password.
func createPasswordValue(
	ctx *pulumi.Context,
	vaultPath string,
	vaultKey string,
	config *password.PasswordConfig,
) pulumi.StringOutput {
	if config.Password != nil && *config.Password != "" {
		log.Info().Msgf("[passwords] using provided password for %s/%s", vaultPath, vaultKey)
		return pulumi.String(*config.Password).ToStringOutput()
	}

	opts := &random.PasswordOptions{
		Length:  defaults.GetOrDefault(config.Length, defaultPasswordLength),
		Special: defaults.GetOrDefault(config.Special, defaultsPasswordSpecial),
	}

	pw, err := random.CreatePassword(ctx, fmt.Sprintf("password-%s-%s", vaultPath, vaultKey), opts)
	if err != nil {
		log.Error().Err(err).Msgf("[passwords] failed to create password for %s/%s", vaultPath, vaultKey)
	}
	if config.Prefix != nil && *config.Prefix != "" {
		return pulumi.Sprintf("%s%s", *config.Prefix, pw.Password)
	}
	return pw.Password
}
