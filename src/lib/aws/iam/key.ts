import * as aws from '@pulumi/aws';
import { Resource } from '@pulumi/pulumi';

/**
 * Defines a new key.
 *
 * @param {string} userName the user name
 * @param {Resource} user the user resource
 * @return {aws.iam.AccessKey} the key
 */
export const createKey = (
  userName: string,
  user: Resource,
): aws.iam.AccessKey =>
  new aws.iam.AccessKey(
    `aws-access-key-${userName}`,
    {
      user: userName,
    },
    {
      dependsOn: [user],
    },
  );
