package cilium

import (
	"fmt"

	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/util/storage"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/storage/google"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/template"
	"github.com/pulumi/pulumi-command/sdk/go/command/local"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	cilConf "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/cilium"
)

// DeployCilium deploys cilium.
// ctx: Pulumi context.
// ciliumConfig: configuration for cilium.
// pulumiOptions: additional Pulumi resource options.
func DeployCilium(
	ctx *pulumi.Context,
	ciliumConfig *cilConf.Config,
	pulumiOptions ...pulumi.ResourceOption,
) pulumi.StringOutput {
	rendered, errRender := template.Render("./assets/helm/cilium.yml.j2", map[string]any{
		"network": ciliumConfig,
	})
	if errRender != nil {
		log.Error().Err(errRender).Msg("[cilium] failed to render values file")
	}

	values := google.WriteFileAndUpload(ctx, &storage.WriteFileAndUploadOptions{
		Name:       "cilium_values.yml",
		Content:    pulumi.String(rendered),
		OutputPath: fmt.Sprintf("./outputs/%s", config.Environment),
		BucketID:   config.BucketID,
		BucketPath: config.BucketPath,
		Labels:     config.CommonLabels(),
	})

	command, errCmd := local.NewCommand(ctx, "helm-cilium", &local.CommandArgs{
		Create: pulumi.String("./assets/helm/install.sh"),
		Environment: pulumi.StringMap{
			"ENVIRONMENT":          pulumi.String(config.Environment),
			"DEPLOYMENT_ID":        pulumi.String("cilium"),
			"DEPLOYMENT_NAMESPACE": pulumi.String("cilium"),
			"VALUES_FILE":          pulumi.String(fmt.Sprintf("./outputs/%s/cilium_values.yml", config.Environment)),
			"HELM_REPO":            pulumi.String("https://helm.cilium.io/"),
			"HELM_CHART_NAME":      pulumi.String("cilium"),
		},
		Triggers: pulumi.Array{values},
	}, pulumiOptions...)
	if errCmd != nil {
		log.Error().Err(errCmd).Msg("[cilium] failed to create helm command")
	}

	return command.Stdout
}
