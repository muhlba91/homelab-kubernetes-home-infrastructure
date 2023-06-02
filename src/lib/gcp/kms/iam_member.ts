import * as gcp from '@pulumi/gcp';
import { CustomResourceOptions } from '@pulumi/pulumi';

/**
 * Defines a new IAM member for a key.
 *
 * @param {string} cryptoKeyId the id of the key
 * @param {string} member the id of the member
 * @param {string[]} role the role
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 */
export const createIAMMember = (
  cryptoKeyId: string,
  member: string,
  role: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  }
) => {
  new gcp.kms.CryptoKeyIAMMember(
    'gcp-kms-iam-member-' +
      member.replace(/[^a-z0-9]/gi, '-') +
      '-' +
      role.replace(/[^a-z0-9]/gi, '-'),
    {
      cryptoKeyId: cryptoKeyId,
      role: role,
      member: member,
    },
    pulumiOptions
  );
};
