import { ServiceAccountData } from '../../../model/google/service_account_data';
import { environment, globalName } from '../../configuration';
import { createKey } from '../../google/iam/key';
import { createServiceAccount } from '../../google/iam/serviceaccount';

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
  }: {
    readonly roles?: readonly string[];
  },
): ServiceAccountData => {
  const accountName = `${name}-${globalName}-${environment}`;
  const serviceAccount = createServiceAccount(accountName, project, {
    roles: roles,
  });
  const key = createKey(accountName, serviceAccount.name, [serviceAccount]);
  return {
    serviceAccount: serviceAccount,
    key: key,
  };
};
