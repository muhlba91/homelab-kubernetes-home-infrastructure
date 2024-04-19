import * as gcp from '@pulumi/gcp';

import { sanitizeText } from '../../util/string';

/**
 * Defines a new IAM member for a GCS bucket.
 *
 * @param {string} bucketId the id of the bucket
 * @param {string} member the id of the member
 * @param {string[]} role the role
 */
export const createGCSIAMMember = (
  bucketId: string,
  member: string,
  role: string,
) => {
  new gcp.storage.BucketIAMMember(
    `gcp-gcs-iam-member-${sanitizeText(bucketId)}-${sanitizeText(member)}-${sanitizeText(role)}`,
    {
      bucket: bucketId,
      role: role,
      member: member,
    },
    {},
  );
};
