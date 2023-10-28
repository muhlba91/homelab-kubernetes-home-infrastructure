import * as gcp from '@pulumi/gcp';
import { Output, Resource } from '@pulumi/pulumi';

/**
 * Defines a new key.
 *
 * @param {string} name the key/service account name
 * @param {Output<string>} serviceAccount the service account
 * @param {Resource[]} dependencies the dependencies
 * @return {google.iam.v1.Key} the key
 */
export const createKey = (
  name: string,
  serviceAccount: Output<string>,
  dependencies: readonly Resource[],
): gcp.serviceaccount.Key =>
  new gcp.serviceaccount.Key(
    `gcp-sa-key-${name}`,
    {
      serviceAccountId: serviceAccount,
    },
    {
      dependsOn: dependencies.map((resource) => resource),
    },
  );
