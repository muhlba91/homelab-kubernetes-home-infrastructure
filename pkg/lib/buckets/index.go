package buckets

import (
	"fmt"

	"github.com/rs/zerolog/log"

	gbucket "github.com/muhlba91/pulumi-shared-library/pkg/lib/google/storage/bucket"
	gmodel "github.com/muhlba91/pulumi-shared-library/pkg/model/google/iam/serviceaccount"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/defaults"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/bucket"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// CreateBuckets creates the GCS bucket resources.
// ctx: Pulumi context.
// googleConfig: Configuration for Google Cloud.
// bucketsConfig: Configuration for buckets.
// secretStoresConfig: Configuration for secret stores (Vault).
func CreateBuckets(
	ctx *pulumi.Context,
	googleConfig *google.Config,
	bucketsConfig *bucket.Config,
	secretStoresConfig *secretstores.Config,
) map[string]*gmodel.User {
	users := make(map[string]*gmodel.User)

	for name, bucketConfig := range bucketsConfig.GCS {
		vaultPath := name
		if bucketConfig.VaultPath != nil {
			vaultPath = *bucketConfig.VaultPath
		}

		bucketID := createDefaultBucket(ctx, name, bucketConfig)
		if bucketConfig.MainBucket != nil && *bucketConfig.MainBucket {
			bucketID = pulumi.String(config.BucketID).ToStringOutput()
		}
		if bucketConfig.BackupBucket != nil && *bucketConfig.BackupBucket {
			bucketID = pulumi.String(config.BackupBucketID).ToStringOutput()
		}

		iam := createServiceAccount(ctx, name, vaultPath, bucketID, googleConfig, secretStoresConfig)
		users[name] = iam

		createHmacKey(ctx, vaultPath, bucketID, iam, googleConfig, secretStoresConfig)
	}

	return users
}

// createDefaultBucket creates a default GCS bucket if configured.
// ctx: Pulumi context.
// name: The name of the bucket.
// bucketConfig: Configuration for the bucket.
func createDefaultBucket(
	ctx *pulumi.Context,
	name string,
	bucketConfig *bucket.BucketConfig,
) pulumi.StringOutput {
	bucketID := pulumi.String(name).ToStringOutput()
	corsConfig := defaults.GetOrDefault(bucketConfig.CORS, bucket.CorsConfig{})

	if bucketConfig.DefaultBucket != nil && *bucketConfig.DefaultBucket {
		bucketName := name
		if bucketConfig.DefaultName != nil {
			bucketName = fmt.Sprintf("%s-%s", *bucketConfig.DefaultName, config.Environment)
		}

		b, err := gbucket.CreateNative(ctx, bucketName, &gbucket.CreateNativeOptions{
			Location: pulumi.String(config.GCPDefaultRegion),
			CORS: &gbucket.CreateNativeCorsOptions{
				MaxAgeSeconds:  corsConfig.MaxAgeSeconds,
				Method:         corsConfig.Method,
				Origin:         corsConfig.Origin,
				ResponseHeader: corsConfig.ResponseHeader,
			},
			Labels: config.CommonLabels(),
		})
		if err != nil {
			log.Error().Err(err).Msgf("[buckets] failed to create native bucket for %s", bucketName)
		}

		bucketID = b.Name
	}

	return bucketID
}
