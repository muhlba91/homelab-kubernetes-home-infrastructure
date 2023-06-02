import * as gcp from '@pulumi/gcp';
import { CustomResourceOptions, Output } from '@pulumi/pulumi';

/**
 * Defines a new key.
 *
 * @param {string} name the key/service account name
 * @param {string | Output<string>} serviceAccountId the id of the service account
 * @param {CustomResourceOptions} pulumiOptions pulumi options (optional)
 * @return {google.iam.v1.Key} the key
 */
export const createKey = (
  name: string,
  serviceAccountId: string | Output<string>,
  { pulumiOptions }: { readonly pulumiOptions?: CustomResourceOptions }
): gcp.serviceaccount.Key =>
  new gcp.serviceaccount.Key(
    'gcp-sa-key-' + name,
    {
      serviceAccountId: serviceAccountId,
    },
    pulumiOptions
  );
