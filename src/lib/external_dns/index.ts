import { interpolate } from '@pulumi/pulumi';

import {
  environment,
  gatesConfig,
  globalName,
  googleConfig,
} from '../configuration';
import { createIAMMember } from '../google/iam/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the external-dns resources.
 */
export const createExternalDNSResources = () => {
  if (!gatesConfig.externalDns) {
    return;
  }
  const roles = ['roles/dns.admin'];
  const iam = createGCPServiceAccountAndKey(
    'external-dns',
    googleConfig.project,
    {},
  );
  createIAMMember(
    `external-dns-${globalName}-${environment}`,
    interpolate`serviceAccount:${iam.serviceAccount.email}`,
    roles,
    {
      project: googleConfig.dnsProject,
    },
  );

  writeToVault(
    'external-dns-google-cloud',
    iam.key.privateKey.apply((key) => JSON.stringify({ credentials: key })),
    `kubernetes-${globalName}-cluster`,
  );
};
