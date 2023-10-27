import { Output } from '@pulumi/pulumi';

import { gcpConfig } from '../configuration';
import { createIAMMember } from '../gcp/kms/iam_member';
import { createGCPServiceAccountAndKey } from '../util/gcp/service_account_user';

/**
 * Creates the ksops resources.
 *
 * @returns {Output<string>} the generated key
 */
export const createFluxServiceAccount = (): Output<string> => {
  const iam = createGCPServiceAccountAndKey('flux', gcpConfig.project, {});

  iam.serviceAccount.email.apply((email) =>
    createIAMMember(
      `${gcpConfig.encryptionKey.location}/${gcpConfig.encryptionKey.keyringId}/${gcpConfig.encryptionKey.cryptoKeyId}`,
      `serviceAccount:${email}`,
      'roles/cloudkms.cryptoKeyEncrypterDecrypter',
      {},
    ),
  );

  return iam.key.privateKey;
};
