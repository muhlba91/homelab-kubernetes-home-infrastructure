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
		gatesConfig, googleConfig, scalewayConfig, talosConfig, ciliumConfig, clusterIntegrationConfig, networkConfig, secretStoresConfig, bucketsConfig, passwordsConfig, err := config.LoadConfig(
			ctx,
		)
		if err != nil {
			return err
		}
		_ = dir.Create(fmt.Sprintf("outputs/%s", config.Environment))

		// resources
		iam := buckets.CreateBuckets(ctx, googleConfig, scalewayConfig, bucketsConfig, secretStoresConfig)
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

/**

  home_cluster-infrastructure-proxmox:buckets:
    gcs:
      cloudnative-pg:
        backupBucket: true
        vaultPath: cloudnativepg
      frigate:
        mainBucket: true
      velero:
        backupBucket: true
      home-assistant:
        backupBucket: true
      librechat:
        defaultBucket: true
        cors:
          maxAgeSeconds: 3600
          responseHeader:
            - Content-Type
          method:
            - GET
            - POST
          origin:
            - https://gpt.home.muehlbachler.io

pulumi config set --path buckets.scaleway.cloudnative-pg.backupBucket true
pulumi config set --path buckets.scaleway.cloudnative-pg.vaultPath cloudnativepg
pulumi config set --path buckets.scaleway.frigate.mainBucket true
pulumi config set --path buckets.scaleway.velero.backupBucket true
pulumi config set --path buckets.scaleway.home-assistant.backupBucket true

pulumi config set --path buckets.scaleway.librechat.defaultBucket true
pulumi config set --path buckets.scaleway.librechat.cors.maxAgeSeconds 3600
pulumi config set --path "buckets.scaleway.librechat.cors.responseHeader[0]" Content-Type
pulumi config set --path "buckets.scaleway.librechat.cors.method[0]" GET
pulumi config set --path "buckets.scaleway.librechat.cors.method[1]" POST
pulumi config set --path "buckets.scaleway.librechat.cors.origin[0]" https://gpt.home.muehlbachler.io

*/
