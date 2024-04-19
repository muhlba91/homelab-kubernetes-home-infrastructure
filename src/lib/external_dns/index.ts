import { interpolate } from '@pulumi/pulumi';

import { environment, gcpConfig, globalName } from '../configuration';
import { createIAMMember } from '../google/iam/iam_member';
import { writeToDoppler } from '../util/doppler/secret';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

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

  writeToVault(
    'external-dns-google-cloud',
    iam.key.privateKey.apply((key) => JSON.stringify({ credentials: key })),
    `kubernetes-${globalName}-cluster`,
  );
};
