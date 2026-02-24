package buckets

import (
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	scw "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/buckets/scaleway"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/bucket"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/scaleway"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// CreateBuckets creates the GCS bucket resources.
// ctx: Pulumi context.
// scalewayConfig: Configuration for Scaleway.
// bucketsConfig: Configuration for buckets.
// secretStoresConfig: Configuration for secret stores (Vault).
func CreateBuckets(
	ctx *pulumi.Context,
	scalewayConfig *scaleway.Config,
	bucketsConfig *bucket.Config,
	secretStoresConfig *secretstores.Config,
) {
	_ = scw.CreateBuckets(ctx, scalewayConfig, bucketsConfig, secretStoresConfig)
}
