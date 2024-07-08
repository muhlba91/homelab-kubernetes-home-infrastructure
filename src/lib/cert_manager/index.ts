import { interpolate } from '@pulumi/pulumi';

import { environment, gcpConfig, globalName } from '../configuration';
import { createIAMMember } from '../google/iam/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the cert-manager resources.
 */
export const createCertManagerResources = () => {
  const roles = ['roles/dns.admin'];
  const iam = createGCPServiceAccountAndKey(
    'cert-manager',
    gcpConfig.project,
    {},
  );
  createIAMMember(
    `cert-manager-${globalName}-${environment}`,
    interpolate`serviceAccount:${iam.serviceAccount.email}`,
    roles,
    {
      project: gcpConfig.dnsProject,
    },
  );

  writeToVault(
    'cert-manager-google-cloud',
    iam.key.privateKey.apply((key) => JSON.stringify({ credentials: key })),
    `kubernetes-${globalName}-cluster`,
  );
};
