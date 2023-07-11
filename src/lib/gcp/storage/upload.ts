import * as gcp from '@pulumi/gcp';
import { CustomResourceOptions } from '@pulumi/pulumi';
import { FileAsset } from '@pulumi/pulumi/asset';

import { commonLabels } from '../../configuration';

/**
 * Uploads a file to GCS.
 *
 * @param {string} bucket the bucket
 * @param {string} key the key in the bucket
 * @param {string} file the file path
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 */
export const uploadToS3 = (
  bucket: string,
  key: string,
  file: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
) => {
  new gcp.storage.BucketObject(
    's3-object-' + bucket + '-' + key.replace(/[^a-z0-9]/gi, '-'),
    {
      bucket: bucket,
      name: key,
      source: new FileAsset(file),
      metadata: commonLabels,
    },
    pulumiOptions,
  );
};
