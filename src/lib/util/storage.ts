import * as gcp from '@pulumi/gcp';
import { Output } from '@pulumi/pulumi';

import { bucketId, environment, globalName } from '../configuration';
import { uploadToGCS } from '../google/storage/upload';

import { writeFilePulumi } from './file';

export const BUCKET_PATH = `cluster/${globalName}/${environment}`;

/**
 * Writes the pulumi Output to a file and uploads it to S3.
 *
 * @param {string} name the name of the file
 * @param {Output<string>} content the content
 * @param {string} s3SubPath the subpath used for the bucket upload (default: '')
 * @param {string} permissions the permissions (default: 0644)
 * @returns {Output<gcp.storage.BucketObject>} to track state
 */
export const writeFilePulumiAndUploadToS3 = (
  name: string,
  content: Output<string>,
  {
    s3SubPath = '',
    permissions = '0644',
  }: { readonly s3SubPath?: string; readonly permissions?: string },
): Output<gcp.storage.BucketObject> => {
  const path = `outputs/${name}`;
  return writeFilePulumi(path, content, {
    permissions: permissions,
  }).apply(() =>
    uploadToGCS(bucketId, `${BUCKET_PATH}/${s3SubPath}${name}`, {
      content: content,
    }),
  );
};
