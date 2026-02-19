package configs

import (
	"bytes"
	"fmt"

	"github.com/muhlba91/pulumi-shared-library/pkg/util/storage"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/storage/google"
	"github.com/muhlba91/pulumi-shared-library/pkg/util/template"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumiverse/pulumi-talos/sdk/go/talos/machine"
	"github.com/rs/zerolog/log"
	"gopkg.in/yaml.v3"

	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/lib/config"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/gates"
	"github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/network"
	talosModel "github.com/muhlba91/homelab-kubernetes-home-infrastructure/pkg/model/config/talos"
)

const defaultIndent = 2

// writeControlplaneAndSecretsFiles writes the controlplane and machine secrets files.
// ctx: Pulumi context.
// machineSecrets: the machine secrets.
// networkConfig: configuration for network.
// talosConfig: configuration for talos.
// gatesConfig: configuration for gates.
func writeControlplaneAndSecretsFiles(
	ctx *pulumi.Context,
	machineSecrets *machine.MachineSecretsOutput,
	networkConfig *network.Config,
	talosConfig *talosModel.Config,
	gatesConfig *gates.Config,
) pulumi.Output {
	controlplaneFile := renderControlplaneFile(ctx, machineSecrets, networkConfig, talosConfig, gatesConfig)

	secretsFile, _ := (machineSecrets.ApplyT(func(secrets any) string {
		var b bytes.Buffer
		enc := yaml.NewEncoder(&b)
		enc.SetIndent(defaultIndent)
		err := enc.Encode(&secrets)
		if err != nil {
			log.Error().Err(err).Msg("[talos][configs] failed to encode machine secrets")
		}
		return sanitizeSecretsFile(b.String())
	})).(pulumi.StringOutput)

	_ = google.WriteFileAndUpload(ctx, &storage.WriteFileAndUploadOptions{
		Name:       "secrets.yaml",
		Content:    secretsFile,
		OutputPath: fmt.Sprintf("./outputs/%s", config.Environment),
		BucketID:   config.BucketID,
		BucketPath: config.BucketPath,
		Labels:     config.CommonLabels(),
	})

	return controlplaneFile
}

// renderControlplaneFile renders the controlplane.yml file using the provided machine secrets, network configuration, talos configuration, and gates configuration.
// ctx: Pulumi context.
// machineSecrets: the machine secrets.
// networkConfig: configuration for network.
// talosConfig: configuration for talos.
// gatesConfig: configuration for gates.
func renderControlplaneFile(
	ctx *pulumi.Context,
	machineSecrets *machine.MachineSecretsOutput,
	networkConfig *network.Config,
	talosConfig *talosModel.Config,
	gatesConfig *gates.Config,
) pulumi.Output {
	controlplane, _ := pulumi.All(
		machineSecrets.Cluster().Id(),
		machineSecrets.Cluster().Secret(),
		machineSecrets.Trustdinfo().Token(),
		machineSecrets.Certs().Os().Cert(),
		machineSecrets.Certs().Os().Key(),
		machineSecrets.Certs().Etcd().Cert(),
		machineSecrets.Certs().Etcd().Key(),
		machineSecrets.Certs().K8s().Cert(),
		machineSecrets.Certs().K8s().Key(),
		machineSecrets.Certs().K8sAggregator().Cert(),
		machineSecrets.Certs().K8sAggregator().Key(),
		machineSecrets.Certs().K8sServiceaccount().Key(),
		machineSecrets.Secrets().BootstrapToken(),
		machineSecrets.Secrets().SecretboxEncryptionSecret(),
	).ApplyT(func(args []any) string {
		clusterID, ok0 := args[0].(string)
		clusterSecret, ok1 := args[1].(string)
		trustdinfoToken, ok2 := args[2].(string)
		certOs, ok3 := args[3].(string)
		keyOs, ok4 := args[4].(string)
		certEtcd, ok5 := args[5].(string)
		keyEtcd, ok6 := args[6].(string)
		certK8s, ok7 := args[7].(string)
		keyK8s, ok8 := args[8].(string)
		certK8sAggregator, ok9 := args[9].(string)
		keyK8sAggregator, ok10 := args[10].(string)
		keyK8sServiceAccount, ok11 := args[11].(string)
		bootstrapToken, ok12 := args[12].(string)
		secretboxEncryptionSecret, ok13 := args[13].(string)

		if !ok0 || !ok1 || !ok2 || !ok3 || !ok4 || !ok5 || !ok6 || !ok7 || !ok8 || !ok9 || !ok10 || !ok11 || !ok12 || !ok13 {
			log.Error().Msg("[talos][configs] failed to cast one or more machine secrets for controlplane rendering")
		}

		cp, err := template.Render("./assets/talos/controlplane.yml.j2", map[string]any{
			"clusterName": config.GlobalName,
			"network":     networkConfig,
			"talos":       talosConfig,
			"secrets": map[string]any{
				"Cluster": map[string]any{
					"Id":     clusterID,
					"Secret": clusterSecret,
				},
				"Trustdinfo": map[string]any{
					"Token": trustdinfoToken,
				},
				"Certs": map[string]any{
					"Os": map[string]any{
						"Cert": certOs,
						"Key":  keyOs,
					},
					"Etcd": map[string]any{
						"Cert": certEtcd,
						"Key":  keyEtcd,
					},
					"K8s": map[string]any{
						"Cert": certK8s,
						"Key":  keyK8s,
					},
					"K8sAggregator": map[string]any{
						"Cert": certK8sAggregator,
						"Key":  keyK8sAggregator,
					},
					"K8sServiceAccount": map[string]any{
						"Key": keyK8sServiceAccount,
					},
				},
				"Secrets": map[string]any{
					"BootstrapToken":            bootstrapToken,
					"SecretboxEncryptionSecret": secretboxEncryptionSecret,
				},
			},
			"gates": gatesConfig,
		})
		if err != nil {
			log.Error().Err(err).Msg("[talos][configs] failed to render controlplane.yml")
		}

		return cp
	}).(pulumi.StringOutput)

	return google.WriteFileAndUpload(ctx, &storage.WriteFileAndUploadOptions{
		Name:       "controlplane.yml",
		Content:    controlplane,
		OutputPath: fmt.Sprintf("./outputs/%s", config.Environment),
		BucketID:   config.BucketID,
		BucketPath: config.BucketPath,
		Labels:     config.CommonLabels(),
	})
}
