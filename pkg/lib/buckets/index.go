package buckets

import (
	gmodel "github.com/muhlba91/pulumi-shared-library/pkg/model/google/iam/serviceaccount"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/buckets/gcs"
	scw "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/buckets/scaleway"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/bucket"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/scaleway"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// CreateBuckets creates the GCS bucket resources.
// ctx: Pulumi context.
// googleConfig: Configuration for Google Cloud.
// scalewayConfig: Configuration for Scaleway.
// bucketsConfig: Configuration for buckets.
// secretStoresConfig: Configuration for secret stores (Vault).
func CreateBuckets(
	ctx *pulumi.Context,
	googleConfig *google.Config,
	scalewayConfig *scaleway.Config,
	bucketsConfig *bucket.Config,
	secretStoresConfig *secretstores.Config,
) map[string]*gmodel.User {
	gcsUsers := gcs.CreateBuckets(ctx, googleConfig, bucketsConfig, secretStoresConfig)
	_ = scw.CreateBuckets(ctx, scalewayConfig, bucketsConfig, secretStoresConfig)

	return gcsUsers
}
