import * as aws from '@pulumi/aws';
import { CustomResourceOptions, Resource } from '@pulumi/pulumi';

import { commonLabels } from '../../configuration';

/**
 * Defines a new User.
 *
 * @param {string} name the name of the account
 * @param {aws.iam.Policy[]} policies the policies to be assigned
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 * @return {google.iam.v1.ServiceAccount} the generated user
 */
export const createUser = (
  name: string,
  {
    policies,
    pulumiOptions,
  }: {
    readonly policies?: readonly aws.iam.Policy[];
    readonly pulumiOptions?: CustomResourceOptions;
  }
): aws.iam.User => {
  const user = new aws.iam.User(
    'aws-user-' + name,
    {
      tags: commonLabels,
    },
    pulumiOptions
  );

  policies?.forEach((policy) =>
    policy.arn.apply(
      (arn) =>
        new aws.iam.UserPolicyAttachment(
          'aws-user-policy-' + name + '-' + arn,
          {
            user: user.name,
            policyArn: arn,
          },
          {
            ...pulumiOptions,
            dependsOn: (
              (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
            ).concat(user, policy),
          }
        )
    )
  );

  return user;
};
