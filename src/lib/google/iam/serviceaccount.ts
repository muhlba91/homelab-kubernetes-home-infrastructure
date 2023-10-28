import * as google from '@pulumi/google-native';
import { interpolate } from '@pulumi/pulumi';

import { createIAMMember } from './iam_member';

/**
 * Defines a new Service Account.
 *
 * @param {string} name the name of the account
 * @param {string} project the project
 * @param {string[]} roles the roles to be assigned
 * @return {google.iam.v1.ServiceAccount} the generated service account
 */
export const createServiceAccount = (
  name: string,
  project: string,
  {
    roles,
  }: {
    readonly roles?: readonly string[];
  },
): google.iam.v1.ServiceAccount => {
  const user = new google.iam.v1.ServiceAccount(
    `gcp-sa-${name}`,
    {
      accountId: name,
      displayName: name,
      project: project,
    },
    {},
  );

  if (roles) {
    createIAMMember(name, interpolate`serviceAccount:${user.email}`, roles, {});
  }

  return user;
};
