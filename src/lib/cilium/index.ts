import { local } from '@pulumi/command';
import { CustomResourceOptions, Output } from '@pulumi/pulumi';

import { environment, talosConfig } from '../configuration';
import { writeFilePulumiAndUploadToS3 } from '../util/storage';
import { renderTemplate } from '../util/template';

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
}): local.Command => {
  const values = writeFilePulumiAndUploadToS3(
    'cilium_values.yml',
    Output.create(
      renderTemplate('assets/helm/cilium.yml.j2', {
        network: talosConfig.cluster.network,
      }),
    ),
    {},
  );

  return new local.Command(
    'helm-cilium',
    {
      create: './assets/helm/install.sh',
      environment: {
        ENVIRONMENT: environment,
        DEPLOYMENT_ID: 'cilium',
        DEPLOYMENT_NAMESPACE: 'cilium',
        VALUES_FILE: `./outputs/${environment}/cilium_values.yml`,
        HELM_REPO: 'https://helm.cilium.io/',
        HELM_CHART_NAME: 'cilium',
      },
      triggers: [values],
    },
    pulumiOptions,
  );
};
