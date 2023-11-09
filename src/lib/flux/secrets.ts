import * as k8s from '@pulumi/kubernetes';
import { Output } from '@pulumi/pulumi';

/**
 * Creates the ksops secrets.
 *
 * @param {Output<string>} serviceAccountKey the flux credentials for GCP
 * @param {k8s.Provider} provider the kubernetes provider
 */
export const deploySecrets = (
  serviceAccountKey: Output<string>,
  provider: k8s.Provider,
) => {
  const namespace = new k8s.core.v1.Namespace(
    'k8s-namespace-flux-system',
    {
      metadata: {
        name: 'flux-system',
      },
    },
    {
      provider: provider,
      protect: false,
    },
  );

  new k8s.core.v1.Secret(
    'k8s-secret-flux-gcp-credentials',
    {
      metadata: {
        name: 'gcp-credentials',
        namespace: namespace.metadata.name,
      },
      data: {
        'credentials.json': serviceAccountKey,
      },
    },
    {
      provider: provider,
      deleteBeforeReplace: true,
      dependsOn: [namespace],
    },
  );
};
