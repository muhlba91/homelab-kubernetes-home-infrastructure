import { local } from '@pulumi/command';
import { CustomResourceOptions } from '@pulumi/pulumi';

/**
 * Deploy cilium.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {local.Command} the command result
 */
export const deployCilium = ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): local.Command =>
  new local.Command(
    'helm-cilium',
    {
      create: './assets/helm/install.sh',
      environment: {
        DEPLOYMENT_ID: 'cilium',
        DEPLOYMENT_NAMESPACE: 'cilium',
        VALUES_FILE: './assets/helm/cilium.yml',
        HELM_REPO: 'https://helm.cilium.io/',
        HELM_CHART_NAME: 'cilium',
      },
    },
    pulumiOptions,
  );
