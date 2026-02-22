package configs

import (
	"fmt"

	"github.com/rs/zerolog/log"

	fileUtil "github.com/muhlba91/pulumi-shared-library/pkg/util/file"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/template"
	"github.com/pulumi/pulumi-command/sdk/go/command/local"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	talosModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/util/file"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/util/random"
)

// writeTalosConfigFiles writes the talosconfig and kubeconfig file.
// ctx: Pulumi context.
// talosConfig: configuration for talos.
func writeTalosConfigFiles(
	ctx *pulumi.Context,
	talosConfig *talosModel.Config,
) pulumi.StringArrayOutput {
	rendered, errRender := template.Render("./assets/talos/talosconfig.sh.j2", map[string]any{
		"environment": config.Environment,
		"endpoint":    talosConfig.Machine.Network.IP.V4,
	})
	if errRender != nil {
		log.Error().Err(errRender).Msg("[talos][configs] failed to render talosconfig.sh")
	}

	configFiles, errCmd := local.NewCommand(ctx, "talos-config-files", &local.CommandArgs{
		Create: pulumi.String(rendered),
		Update: pulumi.String(rendered),
		Triggers: pulumi.Array{
			pulumi.Float64(random.Number()),
		},
	})
	if errCmd != nil {
		log.Error().Err(errCmd).Msg("[talos][configs] failed to create talos-config-files command")
	}

	files, _ := (configFiles.Stdout.ApplyT(func(_ string) []string {
		talosconfig, err := fileUtil.ReadContents(fmt.Sprintf("./outputs/%s/talosconfig.tmp", config.Environment))
		if err != nil {
			log.Error().Err(err).Msg("[talos][configs] failed to read temporary talosconfig")
		}

		_ = file.WriteAndUpload(ctx, "talosconfig", pulumi.String(talosconfig))

		return []string{talosconfig}
	})).(pulumi.StringArrayOutput)

	return files
}
