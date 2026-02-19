package talos

import (
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/cilium"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/talos/configs"
	clusterModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/cluster"
	cilModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/cilium"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/gates"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/network"
	talosModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
)

// CreateCluster creates the cluster.
// ctx: Pulumi context.
// gatesConfig: configuration for gates.
// talosConfig: configuration for talos.
// networkConfig: configuration for network.
// ciliumConfig: configuration for cilium.
func CreateCluster(
	ctx *pulumi.Context,
	gatesConfig *gates.Config,
	talosConfig *talosModel.Config,
	networkConfig *network.Config,
	ciliumConfig *cilModel.Config,
) *clusterModel.Data {
	if !gatesConfig.Cluster {
		return nil
	}

	talosSecrets, controlplane, configFiles := configs.Create(
		ctx,
		gatesConfig,
		talosConfig,
		networkConfig,
	)

	resources, upgradeStdouts := installUpgrade(ctx, controlplane, talosConfig)
	kubernetesProvider, talosctlKubeConfig := createKubernetesProvider(ctx, talosSecrets, talosConfig, upgradeStdouts)
	ciliumDeploy := cilium.DeployCilium(ctx, ciliumConfig, pulumi.DependsOn(resources))
	checkHealth(ctx, talosSecrets, talosConfig, ciliumDeploy)

	return &clusterModel.Data{
		Kubeconfig:  talosctlKubeConfig,
		Talosconfig: configFiles.Index(pulumi.Int(0)),
		Provider:    kubernetesProvider,
	}
}

// installUpgradeAndStdouts performs the installation and upgrade of the cluster and returns the resources and their stdouts.
// ctx: Pulumi context.
// controlplane: output containing the controlplane configuration.
// talosConfig: configuration for talos.
func installUpgrade(
	ctx *pulumi.Context,
	controlplane pulumi.Output,
	talosConfig *talosModel.Config,
) ([]pulumi.Resource, []any) {
	installResource := installCluster(ctx, talosConfig)

	upgradeResources := upgradeCluster(ctx, controlplane, installResource, talosConfig)

	resources := []pulumi.Resource{installResource}
	for _, res := range upgradeResources {
		resources = append(resources, res)
	}

	upgradeStdouts := []any{installResource.Stdout}
	for _, res := range upgradeResources {
		upgradeStdouts = append(upgradeStdouts, res.Stdout)
	}

	return resources, upgradeStdouts
}
