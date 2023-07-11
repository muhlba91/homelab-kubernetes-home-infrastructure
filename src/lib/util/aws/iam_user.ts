import * as aws from '@pulumi/aws';
import { CustomResourceOptions, Resource } from '@pulumi/pulumi';

import { IamUserData } from '../../../model/aws/iam_user_data';
import { createKey } from '../../aws/iam/key';
import { createUser } from '../../aws/iam/user';
import { environment } from '../../configuration';

/**
 * Creates a new user and key.
 *
 * @param {string} name the name
 * @param {aws.iam.Policy[]} policies the policies to add (optional)
 * @returns {IamUserData} the user data
 */
export const createAWSIamUserAndKey = (
  name: string,
  {
    policies,
    pulumiOptions,
  }: {
    readonly policies?: readonly aws.iam.Policy[];
    readonly pulumiOptions?: CustomResourceOptions;
  },
): IamUserData => {
  const accountName = name + '-home-' + environment;
  const user = createUser(accountName, {
    policies: policies,
    pulumiOptions: pulumiOptions,
  });
  const key = user.name.apply((userName) =>
    createKey(userName, {
      pulumiOptions: {
        ...pulumiOptions,
        dependsOn: (
          (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
        ).concat(user),
      },
    }),
  );
  return {
    user: user,
    accessKey: key,
  };
};
