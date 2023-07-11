import * as aws from '@pulumi/aws';
import { CustomResourceOptions } from '@pulumi/pulumi';

/**
 * Defines a new key.
 *
 * @param {string} userName the user name
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 * @return {aws.iam.AccessKey} the key
 */
export const createKey = (
  userName: string,
  { pulumiOptions }: { readonly pulumiOptions?: CustomResourceOptions },
): aws.iam.AccessKey =>
  new aws.iam.AccessKey(
    'aws-access-key-' + userName,
    {
      user: userName,
    },
    pulumiOptions,
  );
