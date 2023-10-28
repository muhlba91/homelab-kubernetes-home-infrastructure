import { interpolate } from '@pulumi/pulumi';

import { environment, gcpConfig, globalName } from '../configuration';
import { createIAMMember } from '../google/iam/iam_member';
import { writeToDoppler } from '../util/doppler/secret';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';

/**
 * Creates the external-dns resources.
 */
export const createExternalDNSResources = () => {
  const roles = ['roles/dns.admin'];
  const iam = createGCPServiceAccountAndKey(
    'external-dns',
    gcpConfig.project,
    {},
  );
  createIAMMember(
    `external-dns-${globalName}-${environment}`,
    interpolate`serviceAccount:${iam.serviceAccount.email}`,
    roles,
    {
      project: gcpConfig.dnsProject,
    },
  );

  writeToDoppler(
    'GCP_CREDENTIALS',
    iam.key.privateKey,
    `${globalName}-cluster-external-dns`,
  );
};
