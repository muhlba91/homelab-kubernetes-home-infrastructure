package kubernetes

import (
	"errors"
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/cluster"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/clusterintegration"
)

// RetrieveProvider retrieves the Kubernetes provider.
// ctx: Pulumi context.
// clusterData: the cluster data.
// clusterIntegrationConfig: configuration for cluster integration.
func RetrieveProvider(
	ctx *pulumi.Context,
	clusterData *cluster.Data,
	clusterIntegrationConfig *clusterintegration.Config,
) (*kubernetes.Provider, error) {
	if clusterData != nil && clusterData.Provider != nil {
		return clusterData.Provider, nil
	}

	if clusterIntegrationConfig != nil && clusterIntegrationConfig.Kubeconfig != "" {
		provider, err := kubernetes.NewProvider(
			ctx,
			fmt.Sprintf("%s-cluster-integration", config.GlobalName),
			&kubernetes.ProviderArgs{
				Kubeconfig: pulumi.String(clusterIntegrationConfig.Kubeconfig),
			},
		)
		if err != nil {
			log.Error().Err(err).Msg("[kubernetes] failed to create provider from cluster integration config")
		}
		return provider, err
	}

	err := errors.New(
		"no Kubernetes provider available: cluster data and cluster integration config are both not set or do not contain the necessary information",
	)
	log.Error().Err(err).Msg("[kubernetes] failed to retrieve provider")
	return nil, err
}
