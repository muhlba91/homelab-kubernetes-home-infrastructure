package flux

import (
	"github.com/rs/zerolog/log"

	"github.com/muhlba91/pulumi-shared-library/pkg/lib/kubernetes/namespace"
	"github.com/muhlba91/pulumi-shared-library/pkg/lib/kubernetes/secret"
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// deploySecrets creates the ksops secrets.
// ctx: Pulumi context.
// serviceAccountKey: the flux credentials for GCP.
// provider: the kubernetes provider.
func deploySecrets(
	ctx *pulumi.Context,
	serviceAccountKey pulumi.StringOutput,
	provider *kubernetes.Provider,
) {
	opts := []pulumi.ResourceOption{pulumi.Provider(provider), pulumi.Protect(false)}

	namespaceName := "flux-system"
	ns, errNs := namespace.Create(ctx, &namespace.CreateOptions{
		Name:          namespaceName,
		PulumiOptions: opts,
	})
	if errNs != nil {
		log.Error().Err(errNs).Msg("[flux][secret] failed to create namespace")
	}

	_, errSec := secret.Create(ctx, &secret.CreateOptions{
		Name:      "gcp-credentials",
		Namespace: namespaceName,
		Data: map[string]pulumi.StringInput{
			"credentials.json": serviceAccountKey,
		},
		PulumiOptions: append(opts, pulumi.DeleteBeforeReplace(true), pulumi.DependsOn([]pulumi.Resource{ns})),
	})
	if errSec != nil {
		log.Error().Err(errSec).Msg("[flux][secret] failed to create secret")
	}
}
