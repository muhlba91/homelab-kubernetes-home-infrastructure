import { CustomResourceOptions, Resource } from '@pulumi/pulumi';

import { ServiceAccountData } from '../../../model/gcp/service_account_data';
import { environment } from '../../configuration';
import { createKey } from '../../gcp/iam/key';
import { createServiceAccount } from '../../gcp/iam/serviceaccount';

/**
 * Creates a new service account and key.
 *
 * @param {string} name the name
 * @param {string} project the project
 * @param {string[]} roles the roles to add (optional)
 * @returns {ServiceAccountData} the user data
 */
export const createGCPServiceAccountAndKey = (
  name: string,
  project: string,
  {
    roles,
    pulumiOptions,
  }: {
    readonly roles?: readonly string[];
    readonly pulumiOptions?: CustomResourceOptions;
  }
): ServiceAccountData => {
  const accountName = name + '-home-' + environment;
  const serviceAccount = createServiceAccount(accountName, project, {
    roles: roles,
  });
  const key = createKey(accountName, serviceAccount.name, {
    pulumiOptions: {
      ...pulumiOptions,
      dependsOn: (
        (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
      ).concat(serviceAccount),
    },
  });
  return {
    serviceAccount: serviceAccount,
    key: key,
  };
};
