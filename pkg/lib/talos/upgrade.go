package talos

import (
	"fmt"
	"strings"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/util/file"
	"github.com/pulumi/pulumi-command/sdk/go/command/local"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"gopkg.in/yaml.v3"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	talosModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
)

// upgradeCluster upgrades the cluster.
// ctx: Pulumi context.
// controlplane: the controlplane output.
// installResource: the Talosctl command resource.
// talosConfig: configuration for talos.
func upgradeCluster(
	ctx *pulumi.Context,
	controlplane pulumi.Output,
	installResource *local.Command,
	talosConfig *talosModel.Config,
) []*local.Command {
	// extract Talos versions
	talosVersion := getTalosVersion(controlplane)
	kubernetesVersion := getKubernetesVersion(controlplane)

	// upgrade Talos
	talosctlUpgrade, errTalos := local.NewCommand(ctx, "talosctl-upgrade", &local.CommandArgs{
		Create: pulumi.String("./assets/talos/noop.sh"),
		Update: pulumi.String("./assets/talos/upgrade_talos.sh"),
		Environment: pulumi.StringMap{
			"ENVIRONMENT":        pulumi.String(config.Environment),
			"CONTROL_PLANE_IP":   pulumi.String(talosConfig.Machine.Network.IP.V4),
			"INSTALL_IMAGE_HASH": pulumi.String(talosConfig.Cluster.InstallImageHash),
			"TALOS_VERSION":      talosVersion,
		},
		Triggers: pulumi.Array{talosVersion},
	}, pulumi.Timeouts(&pulumi.CustomTimeouts{
		Create: "60m",
	}), pulumi.DependsOn([]pulumi.Resource{installResource}))
	if errTalos != nil {
		log.Error().Err(errTalos).Msg("[talos][upgrade] failed to create talosctl-upgrade command")
	}

	// upgrade Kubernetes
	talosctlUpgradeK8s, errK8s := local.NewCommand(ctx, "talosctl-upgrade-k8s", &local.CommandArgs{
		Create: pulumi.String("./assets/talos/noop.sh"),
		Update: pulumi.String("./assets/talos/upgrade_k8s.sh"),
		Environment: pulumi.StringMap{
			"ENVIRONMENT":        pulumi.String(config.Environment),
			"CONTROL_PLANE_IP":   pulumi.String(talosConfig.Machine.Network.IP.V4),
			"KUBERNETES_VERSION": kubernetesVersion,
		},
		Triggers: pulumi.Array{kubernetesVersion},
	}, pulumi.Timeouts(&pulumi.CustomTimeouts{
		Create: "60m",
	}), pulumi.DependsOn([]pulumi.Resource{installResource, talosctlUpgrade}))
	if errK8s != nil {
		log.Error().Err(errK8s).Msg("[talos][upgrade] failed to create talosctl-upgrade-k8s command")
	}

	return []*local.Command{talosctlUpgrade, talosctlUpgradeK8s}
}

// getTalosVersion extracts the Talos version from the controlplane configuration.
// controlplane: the controlplane output.
func getTalosVersion(controlplane pulumi.Output) pulumi.StringOutput {
	talosVersion, _ := controlplane.ApplyT(func(_ any) string {
		doc := getControlplaneContent()

		version := extractVersion(doc, "machine", "install")
		if version == nil {
			log.Error().Msg("[talos][upgrade] failed to extract Talos version from controlplane.yml")
			return ""
		}
		return *version
	}).(pulumi.StringOutput)

	return talosVersion
}

// getKubernetesVersion extracts the Kubernetes version from the controlplane configuration.
// controlplane: the controlplane output.
func getKubernetesVersion(controlplane pulumi.Output) pulumi.StringOutput {
	kubernetesVersion, _ := controlplane.ApplyT(func(_ any) string {
		doc := getControlplaneContent()

		version := extractVersion(doc, "cluster", "apiServer")
		if version == nil {
			log.Error().Msg("[talos][upgrade] failed to extract K8s version from controlplane.yml")
			return ""
		}
		return *version
	}).(pulumi.StringOutput)

	return kubernetesVersion
}

// getControlplaneContent extracts the controlplane content as a map.
func getControlplaneContent() map[string]any {
	content, err := file.ReadContents(fmt.Sprintf("./outputs/%s/controlplane.yml", config.Environment))
	if err != nil {
		log.Error().Err(err).Msg("[talos][upgrade] failed to read controlplane.yml")
	}

	var doc map[string]any
	err = yaml.Unmarshal([]byte(content), &doc)
	if err != nil {
		log.Error().Err(err).Msg("[talos][upgrade] failed to unmarshal controlplane.yml")
	}

	return doc
}

// extractVersion extracts the version from the given path in the controlplane configuration.
// doc: the controlplane configuration as a map.
// path: the path to the image field (e.g., "machine.install" or "cluster.apiServer").
func extractVersion(doc map[string]any, path ...string) *string {
	current := doc
	for _, p := range path {
		next, ok := current[p].(map[string]any)
		if !ok {
			log.Error().Msgf("[talos][upgrade] failed to extract version from path: %s", strings.Join(path, "."))
			return nil
		}
		current = next
	}

	image, _ := current["image"].(string)
	parts := strings.Split(image, ":")
	//nolint:mnd // version is always the second part of the image
	if len(parts) < 2 {
		log.Error().Msgf("[talos][upgrade] failed to extract version from image: %s", image)
		return nil
	}

	return &parts[1]
}
