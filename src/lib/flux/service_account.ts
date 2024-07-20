import { Output } from '@pulumi/pulumi';

import { googleConfig } from '../configuration';
import { createIAMMember } from '../google/kms/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';

/**
 * Creates the ksops resources.
 *
 * @returns {Output<string>} the generated key
 */
export const createFluxServiceAccount = (): Output<string> => {
  const iam = createGCPServiceAccountAndKey('flux', googleConfig.project, {});

  iam.serviceAccount.email.apply((email) =>
    createIAMMember(
      `${googleConfig.encryptionKey.location}/${googleConfig.encryptionKey.keyringId}/${googleConfig.encryptionKey.cryptoKeyId}`,
      `serviceAccount:${email}`,
      'roles/cloudkms.cryptoKeyEncrypterDecrypter',
    ),
  );

  return iam.key.privateKey;
};
