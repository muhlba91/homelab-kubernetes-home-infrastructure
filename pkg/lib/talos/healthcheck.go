package talos

import (
	"github.com/rs/zerolog/log"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumiverse/pulumi-talos/sdk/go/talos/cluster"
	"github.com/pulumiverse/pulumi-talos/sdk/go/talos/machine"

	talosModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
)

// checkHealth checks the health of the cluster by calling the GetHealth function from the Talos cluster package.
// ctx: Pulumi context.
// talosSecrets: secrets generated for the Talos machine, used to get the client configuration for authentication.
// talosConfig: configuration for Talos, used to get the control plane node IP for the health check.
// ciliumDeploy: output from the Cilium deployment, used to ensure the health check is performed after Cilium is deployed.
func checkHealth(
	ctx *pulumi.Context,
	talosSecrets *machine.Secrets,
	talosConfig *talosModel.Config,
	ciliumDeploy pulumi.Output,
) {
	pulumi.All(ciliumDeploy, talosSecrets.ClientConfiguration.CaCertificate(), talosSecrets.ClientConfiguration.ClientCertificate(), talosSecrets.ClientConfiguration.ClientKey()).
		ApplyT(func(args []any) error {
			caCertificate, ok1 := args[1].(string)
			clientCertificate, ok2 := args[2].(string)
			clientKey, ok3 := args[3].(string)

			if !ok1 || !ok2 || !ok3 {
				log.Error().Msg("[talos][health] failed to cast one or more client configuration values")
			}

			_, err := cluster.GetHealth(ctx, &cluster.GetHealthArgs{
				ClientConfiguration: cluster.GetHealthClientConfiguration{
					CaCertificate:     caCertificate,
					ClientCertificate: clientCertificate,
					ClientKey:         clientKey,
				},
				ControlPlaneNodes: []string{talosConfig.Machine.Network.IP.V4},
				Endpoints:         []string{talosConfig.Machine.Network.IP.V4},
			})
			if err != nil {
				log.Error().Err(err).Msg("[talos][health] failed to check health")
			}

			return nil
		})
}
