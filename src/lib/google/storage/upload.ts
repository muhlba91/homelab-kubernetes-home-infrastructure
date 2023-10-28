import * as gcp from '@pulumi/gcp';
import { CustomResourceOptions, Output } from '@pulumi/pulumi';
import { FileAsset } from '@pulumi/pulumi/asset';

import { commonLabels } from '../../configuration';
import { sanitizeText } from '../../util/string';

/**
 * Uploads a file to GCS.
 *
 * @param {string} bucket the bucket
 * @param {string} key the key in the bucket
 * @param {string} file the file path
 * @param {string | Output<string>} content the content
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 * @returns {gcp.storage.BucketObject} the object
 */
export const uploadToGCS = (
  bucket: string,
  key: string,
  {
    file,
    content,
    pulumiOptions,
  }: {
    readonly file?: string;
    readonly content?: string | Output<string>;
    readonly pulumiOptions?: CustomResourceOptions;
  },
): gcp.storage.BucketObject =>
  new gcp.storage.BucketObject(
    `gcs-object-${bucket}-${sanitizeText(key)}`,
    {
      bucket: bucket,
      name: key,
      source: file != undefined ? new FileAsset(file) : undefined,
      content: content,
      metadata: commonLabels,
    },
    pulumiOptions,
  );
