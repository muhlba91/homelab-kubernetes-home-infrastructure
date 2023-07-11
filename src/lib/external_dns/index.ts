import { CustomResourceOptions } from '@pulumi/pulumi';

import { clusterConfig } from '../configuration';
import { writeToDoppler } from '../util/doppler/secret';
import { createGCPServiceAccountAndKey } from '../util/gcp/service_account_user';

/**
 * Creates the external-dns resources.
 *
 * @param {string} project the project
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Promise<void>} nothing
 */
export const createExternalDNSResources = async (
  project: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Promise<void> => {
  const roles = ['roles/dns.admin'];
  const iam = createGCPServiceAccountAndKey('external-dns', project, {
    roles: roles,
    pulumiOptions: pulumiOptions,
  });

  writeToDoppler(
    'GCP_CREDENTIALS',
    iam.key.privateKey,
    clusterConfig.name + '-cluster-external-dns',
  );
};
