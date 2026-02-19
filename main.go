package main

import (
	"fmt"

	"github.com/muhlba91/pulumi-shared-library/pkg/util/dir"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/buckets"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/certmanager"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/externaldns"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/flux"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/homeassistant"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/influxdb"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/kubernetes"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/passwords"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/talos"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// configuration
		gatesConfig, googleConfig, talosConfig, ciliumConfig, clusterIntegrationConfig, networkConfig, secretStoresConfig, bucketsConfig, passwordsConfig, err := config.LoadConfig(
			ctx,
		)
		if err != nil {
			return err
		}
		_ = dir.Create(fmt.Sprintf("outputs/%s", config.Environment))

		// resources
		iam := buckets.CreateBuckets(ctx, googleConfig, bucketsConfig, secretStoresConfig)
		passwords.Create(ctx, passwordsConfig, secretStoresConfig)
		homeassistant.CreateResources(ctx, gatesConfig, googleConfig, secretStoresConfig, iam["home-assistant"])
		influxdb.CreateResources(ctx, gatesConfig, secretStoresConfig)
		externaldns.CreateResources(ctx, gatesConfig, googleConfig, secretStoresConfig)
		certmanager.CreateResources(ctx, gatesConfig, googleConfig, secretStoresConfig)

		// talos cluster
		clusterData := talos.CreateCluster(ctx, gatesConfig, talosConfig, networkConfig, ciliumConfig)
		provider, err := kubernetes.RetrieveProvider(ctx, clusterData, clusterIntegrationConfig)
		if err != nil {
			return err
		}

		// flux
		flux.CreateResources(ctx, gatesConfig, googleConfig, provider)

		return nil
	})
}
