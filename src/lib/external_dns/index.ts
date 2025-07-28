import { interpolate } from '@pulumi/pulumi';

import { fixedStackName, globalName, googleConfig } from '../configuration';
import { createIAMMember } from '../google/iam/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the external-dns resources.
 */
export const createExternalDNSResources = () => {
  const roles = ['roles/dns.admin'];
  const iam = createGCPServiceAccountAndKey(
    'external-dns',
    googleConfig.project,
    {},
  );
  createIAMMember(
    `external-dns-${globalName}-${fixedStackName}`, // TODO: replace with dynamic value
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
