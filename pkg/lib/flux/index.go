package flux

import (
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/gates"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
)

// CreateResources creates the FluxCD resources.
// ctx: Pulumi context.
// gatesConfig: Configuration for gates.
// googleConfig: Configuration for Google Cloud.
// provider: the Kubernetes provider.
func CreateResources(
	ctx *pulumi.Context,
	gatesConfig *gates.Config,
	googleConfig *google.Config,
	provider *kubernetes.Provider,
) {
	if gatesConfig.Flux && provider != nil {
		serviceAccountKey := createFluxServiceAccount(ctx, googleConfig)

		deploySecrets(ctx, serviceAccountKey, provider)
	}
}
