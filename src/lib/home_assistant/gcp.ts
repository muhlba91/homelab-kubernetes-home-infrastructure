import { CustomResourceOptions } from '@pulumi/pulumi';

import { clusterConfig, gcpConfig } from '../configuration';
import { createIAMMember } from '../gcp/kms/iam_member';
import { writeToDoppler } from '../util/doppler/secret';
import { createGCPServiceAccountAndKey } from '../util/gcp/service_account_user';

/**
 * Creates the Home Assistant GCP key.
 *
 * @param {string} gcpProject the GCP project
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const createGCPKey = async (
  gcpProject: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Promise<void> => {
  const iam = createGCPServiceAccountAndKey('home-assistant-gcp', gcpProject, {
    pulumiOptions: pulumiOptions,
  });

  iam.serviceAccount.email.apply((email) =>
    createIAMMember(
      `${gcpConfig.encryptionKey.location}/${gcpConfig.encryptionKey.keyringId}/${gcpConfig.encryptionKey.cryptoKeyId}`,
      `serviceAccount:${email}`,
      'roles/cloudkms.cryptoKeyEncrypterDecrypter',
      { pulumiOptions: pulumiOptions },
    ),
  );

  writeToDoppler(
    'GCP_CREDENTIALS',
    iam.key.privateKey,
    clusterConfig.name + '-cluster-home-assistant',
  );
};
