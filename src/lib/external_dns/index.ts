import { CustomResourceOptions, interpolate } from '@pulumi/pulumi';

import { clusterConfig, environment, gcpConfig } from '../configuration';
import { createIAMMember } from '../gcp/iam/iam_member';
import { writeToDoppler } from '../util/doppler/secret';
import { createGCPServiceAccountAndKey } from '../util/gcp/service_account_user';

/**
 * Creates the external-dns resources.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Promise<void>} nothing
 */
export const createExternalDNSResources = async ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): Promise<void> => {
  const roles = ['roles/dns.admin'];
  const iam = createGCPServiceAccountAndKey('external-dns', gcpConfig.project, {
    pulumiOptions: pulumiOptions,
  });
  createIAMMember(
    'external-dns-home-' + environment,
    interpolate`serviceAccount:${iam.serviceAccount.email}`,
    roles,
    {
      project: gcpConfig.dnsProject,
      pulumiOptions: pulumiOptions,
    },
  );

  writeToDoppler(
    'GCP_CREDENTIALS',
    iam.key.privateKey,
    clusterConfig.name + '-cluster-external-dns',
  );
};
