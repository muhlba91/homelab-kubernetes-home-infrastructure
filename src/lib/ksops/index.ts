import { CustomResourceOptions, Output } from '@pulumi/pulumi';

import { gcpConfig } from '../configuration';
import { createIAMMember } from '../gcp/kms/iam_member';
import { createGCPServiceAccountAndKey } from '../util/gcp/service_account_user';

/**
 * Creates the ksops resources.
 *
 * @param {string} project the project
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Promise<Output<string>>} the generated key
 */
export const createKSopsResources = async (
  project: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  }
): Promise<Output<string>> => {
  const iam = createGCPServiceAccountAndKey('ksops-gcp', project, {
    pulumiOptions: pulumiOptions,
  });

  iam.serviceAccount.email.apply((email) =>
    createIAMMember(
      `${gcpConfig.encryptionKey.location}/${gcpConfig.encryptionKey.keyringId}/${gcpConfig.encryptionKey.cryptoKeyId}`,
      `serviceAccount:${email}`,
      'roles/cloudkms.cryptoKeyEncrypterDecrypter',
      { pulumiOptions: pulumiOptions }
    )
  );

  return iam.key.privateKey;
};
