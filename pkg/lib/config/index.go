package config

import (
	"fmt"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
	"github.com/rs/zerolog/log"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/bucket"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/cilium"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/clusterintegration"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/gates"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/google"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/network"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/password"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/secretstores"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
)

//nolint:gochecknoglobals // global configuration is acceptable here
var (
	// Environment holds the current deployment environment (e.g., dev, staging, prod).
	Environment string
	// GlobalName is a constant name used across resources.
	GlobalName = "home"
	// GCPDefaultRegion is the default GCP region for deployments.
	GCPDefaultRegion = "europe-west4"
	// BucketPath is the path within the buckets for this project.
	BucketPath string
	// BucketID is the ID of the main storage bucket.
	BucketID string
	// BackupBucketID is the ID of the backup storage bucket.
	BackupBucketID string
)

// LoadConfig loads the configuration for the given Pulumi context.
// ctx: The Pulumi context.
func LoadConfig(
	ctx *pulumi.Context,
) (
	*gates.Config,
	*google.Config,
	*talos.Config,
	*cilium.Config,
	*clusterintegration.Config,
	*network.Config,
	*secretstores.Config,
	*bucket.Config,
	*password.Config,
	error,
) {
	Environment = ctx.Stack()

	cfg := config.New(ctx, "")

	BucketID = cfg.Require("bucketId")
	BackupBucketID = cfg.Require("backupBucketId")
	BucketPath = fmt.Sprintf("cluster/%s", Environment)

	var gatesConfig gates.Config
	cfg.RequireObject("gates", &gatesConfig)

	var googleConfig google.Config
	cfg.RequireObject("google", &googleConfig)

	var talosConfig talos.Config
	cfg.RequireObject("talos", &talosConfig)

	var ciliumConfig cilium.Config
	cfg.RequireObject("cilium", &ciliumConfig)

	var clusterIntegrationConfig clusterintegration.Config
	err := cfg.GetObject("clusterIntegration", &clusterIntegrationConfig)
	if err != nil {
		log.Error().Err(err).Msg("[config] failed to get optional clusterIntegration config")
	}

	var networkConfig network.Config
	cfg.RequireObject("network", &networkConfig)

	var secretStoresConfig secretstores.Config
	cfg.RequireObject("secretStores", &secretStoresConfig)

	var bucketsConfig bucket.Config
	cfg.RequireObject("buckets", &bucketsConfig)

	var passwordsConfig password.Config
	cfg.RequireObject("passwords", &passwordsConfig)

	return &gatesConfig,
		&googleConfig,
		&talosConfig,
		&ciliumConfig,
		&clusterIntegrationConfig,
		&networkConfig,
		&secretStoresConfig,
		&bucketsConfig,
		&passwordsConfig,
		nil
}

// CommonLabels returns a map of common labels to be used across resources.
func CommonLabels() map[string]string {
	return map[string]string{
		"environment": Environment,
		"cluster":     GlobalName,
	}
}
