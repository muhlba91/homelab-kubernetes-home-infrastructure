import * as google from '@pulumi/google-native';
import { CustomResourceOptions, interpolate } from '@pulumi/pulumi';

import { createIAMMember } from './iam_member';

/**
 * Defines a new Service Account.
 *
 * @param {string} name the name of the account
 * @param {string} project the project
 * @param {string[]} roles the roles to be assigned
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 * @return {google.iam.v1.ServiceAccount} the generated service account
 */
export const createServiceAccount = (
  name: string,
  project: string,
  {
    roles,
    pulumiOptions,
  }: {
    readonly roles?: readonly string[];
    readonly pulumiOptions?: CustomResourceOptions;
  }
): google.iam.v1.ServiceAccount => {
  const user = new google.iam.v1.ServiceAccount(
    'gcp-sa-' + name,
    {
      accountId: name,
      displayName: name,
      project: project,
    },
    pulumiOptions
  );

  if (roles) {
    createIAMMember(name, interpolate`serviceAccount:${user.email}`, roles, {
      pulumiOptions: pulumiOptions,
    });
  }

  return user;
};
