package configs

import (
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumiverse/pulumi-talos/sdk/go/talos/machine"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/gates"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/network"
	talosModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
)

// Create creates the Talos configuration files and secrets needed for the cluster installation.
// ctx: Pulumi context.
// gatesConfig: configuration for gates.
// talosConfig: configuration for talos.
// networkConfig: configuration for network.
func Create(
	ctx *pulumi.Context,
	gatesConfig *gates.Config,
	talosConfig *talosModel.Config,
	networkConfig *network.Config,
) (*machine.Secrets, pulumi.Output, pulumi.StringArrayOutput) {
	talosSecrets, err := machine.NewSecrets(
		ctx,
		fmt.Sprintf("talos-secrets-%s", talosConfig.Cluster.Revision),
		&machine.SecretsArgs{},
	)
	if err != nil {
		log.Error().Err(err).Msg("[talos][configs] failed to create new machine secrets")
	}

	controlplane := writeControlplaneAndSecretsFiles(
		ctx,
		&talosSecrets.MachineSecrets,
		networkConfig,
		talosConfig,
		gatesConfig,
	)
	configFiles := writeTalosConfigFiles(ctx, talosConfig)

	return talosSecrets, controlplane, configFiles
}
