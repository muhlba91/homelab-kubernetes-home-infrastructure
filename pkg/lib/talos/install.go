package talos

import (
	"github.com/pulumi/pulumi-command/sdk/go/command/local"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/rs/zerolog/log"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	talosModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
)

// installTimeout is the timeout for the cluster installation.
const installTimeout = "60m"

// installCluster installs the cluster.
// ctx: Pulumi context.
// talosConfig: configuration for talos.
func installCluster(
	ctx *pulumi.Context,
	talosConfig *talosModel.Config,
) *local.Command {
	talosctlValidate, errVal := local.NewCommand(ctx, "talosctl-validate", &local.CommandArgs{
		Create: pulumi.String("./assets/talos/validate.sh"),
		Update: pulumi.String("./assets/talos/validate.sh"),
		Environment: pulumi.StringMap{
			//nolint:goconst // these keys are used in the template and should not be changed
			"ENVIRONMENT": pulumi.String(config.Environment),
		},
	})
	if errVal != nil {
		log.Error().Err(errVal).Msg("[talos][install] failed to create talosctl-validate command")
	}

	cmd, errApp := local.NewCommand(ctx, "talosctl-apply", &local.CommandArgs{
		Create: pulumi.String("./assets/talos/apply.sh"),
		Environment: pulumi.StringMap{
			"ENVIRONMENT": pulumi.String(config.Environment),
			//nolint:goconst // these keys are used in the template and should not be changed
			"CONTROL_PLANE_IP": pulumi.String(talosConfig.Machine.Network.IP.V4),
		},
	}, pulumi.Timeouts(&pulumi.CustomTimeouts{
		Create: installTimeout,
	}), pulumi.DependsOn([]pulumi.Resource{talosctlValidate}))
	if errApp != nil {
		log.Error().Err(errApp).Msg("[talos][install] failed to create talosctl-apply command")
	}

	return cmd
}
