import { local } from '@pulumi/command';
import { CustomResourceOptions } from '@pulumi/pulumi';

import { environment, k0sConfig } from '../configuration';
import { writeFileContents } from '../util/file';
import { renderTemplate } from '../util/template';

/**
 * Deploy cilium.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const deployCilium = ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}) => {
  writeFileContents(
    'outputs/values-cilium.yml',
    renderTemplate('assets/helm/cilium.yml.j2', {
      k0s: k0sConfig,
    }),
    {},
  );
  new local.Command(
    'helm-cilium',
    {
      create: './assets/helm/install.sh',
      environment: {
        DEPLOYMENT_ID: 'cilium',
        DEPLOYMENT_ENV: environment,
        DEPLOYMENT_NAMESPACE: 'cilium',
        HELM_REPO: 'https://helm.cilium.io/',
        HELM_CHART_NAME: 'cilium',
      },
    },
    pulumiOptions,
  );
};
