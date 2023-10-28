import * as aws from '@pulumi/aws';

import { commonLabels } from '../../configuration';
import { sanitizeText } from '../../util/string';

/**
 * Defines a new User.
 *
 * @param {string} name the name of the account
 * @param {aws.iam.Policy[]} policies the policies to be assigned
 * @return {google.iam.v1.ServiceAccount} the generated user
 */
export const createUser = (
  name: string,
  {
    policies,
  }: {
    readonly policies?: readonly aws.iam.Policy[];
  },
): aws.iam.User => {
  const user = new aws.iam.User(
    `aws-user-${name}`,
    {
      tags: commonLabels,
    },
    {},
  );

  policies?.forEach((policy) =>
    policy.arn.apply(
      (arn) =>
        new aws.iam.UserPolicyAttachment(
          `aws-user-policy-${name}-${sanitizeText(arn)}`,
          {
            user: user.name,
            policyArn: arn,
          },
          {
            dependsOn: [user, policy],
          },
        ),
    ),
  );

  return user;
};
