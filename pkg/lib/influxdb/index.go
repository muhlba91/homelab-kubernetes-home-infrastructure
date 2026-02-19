package influxdb

import (
	"encoding/json"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/lib/random"
	"github.com/muhlba91/pulumi-shared-library/pkg/lib/vault/secret"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/gates"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

const defaultTokenLength = 32

// CreateResources creates the InfluxDB resources.
// ctx: Pulumi context.
// gatesConfig: Configuration for gates.
// secretStoresConfig: Configuration for secret stores (Vault).
func CreateResources(
	ctx *pulumi.Context,
	gatesConfig *gates.Config,
	secretStoresConfig *secretstores.Config,
) {
	if !gatesConfig.InfluxDB && !gatesConfig.HomeAssistant {
		return
	}

	password, errPw := random.CreatePassword(ctx, "password-influxdb-admin-password", &random.PasswordOptions{
		Special: false,
	})
	if errPw != nil {
		log.Error().Err(errPw).Msg("[influxdb] failed to create admin password")
	}

	token, errTok := random.CreatePassword(ctx, "password-influxdb-admin-token", &random.PasswordOptions{
		Length:  defaultTokenLength,
		Special: false,
	})
	if errTok != nil {
		log.Error().Err(errTok).Msg("[influxdb] failed to create admin token")
	}

	vaultValue, _ := (pulumi.All(password.Password, token.Password).ApplyT(func(args []any) (string, error) {
		pw, ok := args[0].(string)
		if !ok {
			log.Error().Msg("[influxdb] failed to cast password")
		}
		tok, ok := args[1].(string)
		if !ok {
			log.Error().Msg("[influxdb] failed to cast token")
		}
		data, err := json.Marshal(map[string]string{
			"password": pw,
			"token":    tok,
		})
		if err != nil {
			log.Error().Err(err).Msg("[influxdb][vault] failed to marshal admin credentials")
		}
		return string(data), nil
	})).(pulumi.StringOutput)

	_, errVault := secret.Create(ctx, &secret.CreateOptions{
		Key:   "influxdb-user-admin",
		Value: vaultValue,
		Path:  secretStoresConfig.VaultMount,
	})
	if errVault != nil {
		log.Error().Err(errVault).Msg("[influxdb][vault] failed to create secret")
	}
}
