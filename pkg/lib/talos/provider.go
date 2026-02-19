package talos

import (
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/util/storage"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/storage/google"
	k8sProvider "github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumiverse/pulumi-talos/sdk/go/talos/cluster"
	"github.com/pulumiverse/pulumi-talos/sdk/go/talos/machine"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	talosModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
)

// createKubernetesProvider creates a Kubernetes provider using the kubeconfig generated from the Talos secrets and configuration.
// ctx: Pulumi context.
// talosSecrets: secrets generated for the Talos machine.
// talosConfig: configuration for Talos.
// upgradeStdouts: stdouts from the installation and upgrade resources, used to ensure the provider is created after the cluster is ready.
func createKubernetesProvider(
	ctx *pulumi.Context,
	talosSecrets *machine.Secrets,
	talosConfig *talosModel.Config,
	upgradeStdouts []any,
) (*k8sProvider.Provider, pulumi.StringOutput) {
	talosctlKubeConfig, _ := pulumi.All(upgradeStdouts...).ApplyT(func(_ []any) pulumi.StringOutput {
		kubeconfig, err := cluster.NewKubeconfig(ctx, "talos-kubeconfig", &cluster.KubeconfigArgs{
			ClientConfiguration: cluster.KubeconfigClientConfigurationArgs{
				CaCertificate:     talosSecrets.ClientConfiguration.CaCertificate(),
				ClientCertificate: talosSecrets.ClientConfiguration.ClientCertificate(),
				ClientKey:         talosSecrets.ClientConfiguration.ClientKey(),
			},
			Node: pulumi.String(talosConfig.Machine.Network.IP.V4),
		})
		if err != nil {
			log.Error().Err(err).Msg("[talos][provider] failed to create new kubeconfig")
		}
		return kubeconfig.KubeconfigRaw
	}).(pulumi.StringOutput)

	_ = google.WriteFileAndUpload(ctx, &storage.WriteFileAndUploadOptions{
		Name:       "admin.conf",
		Content:    talosctlKubeConfig,
		OutputPath: fmt.Sprintf("./outputs/%s", config.Environment),
		BucketID:   config.BucketID,
		BucketPath: config.BucketPath,
		Labels:     config.CommonLabels(),
	})

	kubernetesProvider, errProv := k8sProvider.NewProvider(
		ctx,
		fmt.Sprintf("%s-cluster", config.GlobalName),
		&k8sProvider.ProviderArgs{
			Kubeconfig: talosctlKubeConfig,
		},
	)
	if errProv != nil {
		log.Error().Err(errProv).Msg("[talos][provider] failed to create kubernetes provider")
	}

	return kubernetesProvider, talosctlKubeConfig
}
