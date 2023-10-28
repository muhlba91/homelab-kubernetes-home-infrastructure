import * as gcp from '@pulumi/gcp';

import { sanitizeText } from '../../util/string';

/**
 * Defines a new IAM member for a key.
 *
 * @param {string} cryptoKeyId the id of the key
 * @param {string} member the id of the member
 * @param {string[]} role the role
 */
export const createIAMMember = (
  cryptoKeyId: string,
  member: string,
  role: string,
) => {
  new gcp.kms.CryptoKeyIAMMember(
    `gcp-kms-iam-member-${sanitizeText(member)}-${sanitizeText(role)}`,
    {
      cryptoKeyId: cryptoKeyId,
      role: role,
      member: member,
    },
    {},
  );
};
