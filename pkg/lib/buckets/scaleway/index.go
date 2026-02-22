package scaleway

import (
	"fmt"

	"github.com/rs/zerolog/log"

	sbucket "github.com/muhlba91/pulumi-shared-library/pkg/lib/scaleway/storage/bucket"
	smodel "github.com/muhlba91/pulumi-shared-library/pkg/model/scaleway/iam/application"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/defaults"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/bucket"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/scaleway"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
)

// CreateBuckets creates the Scaleway bucket resources.
// ctx: Pulumi context.
// scalewayConfig: Configuration for Scaleway.
// bucketsConfig: Configuration for buckets.
// secretStoresConfig: Configuration for secret stores (Vault).
func CreateBuckets(
	ctx *pulumi.Context,
	scalewayConfig *scaleway.Config,
	bucketsConfig *bucket.Config,
	secretStoresConfig *secretstores.Config,
) map[string]*smodel.Application {
	apps := make(map[string]*smodel.Application)

	for name, bucketConfig := range bucketsConfig.Scaleway {
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

		app := createApplication(ctx, name, vaultPath, bucketID, scalewayConfig, secretStoresConfig)
		apps[name] = app
	}

	return apps
}

// createDefaultBucket creates a default Scaleway bucket if configured.
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
			bucketName = *bucketConfig.DefaultName
		}
		bucketName = fmt.Sprintf("%s-cluster-%s-%s", config.GlobalName, config.Environment, bucketName)

		b, err := sbucket.Create(ctx, bucketName, &sbucket.CreateOptions{
			Location: pulumi.String(config.ScalewayDefaultRegion),
			CORS: &sbucket.CreateCorsOptions{
				MaxAgeSeconds:  corsConfig.MaxAgeSeconds,
				Method:         corsConfig.Method,
				Origin:         corsConfig.Origin,
				ResponseHeader: corsConfig.ResponseHeader,
			},
			Labels: config.CommonLabels(),
		})
		if err != nil {
			log.Error().Err(err).Msgf("[buckets][scaleway] failed to create bucket for %s", bucketName)
		}

		bucketID = b.Name
	}

	return bucketID
}
