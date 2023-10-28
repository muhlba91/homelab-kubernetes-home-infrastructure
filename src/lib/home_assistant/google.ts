import { gcpConfig, globalName } from '../configuration';
import { createIAMMember } from '../google/kms/iam_member';
import { writeToDoppler } from '../util/doppler/secret';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';

/**
 * Creates the Home Assistant GCP key.
 */
export const createGCPKey = () => {
  const iam = createGCPServiceAccountAndKey(
    'home-assistant',
    gcpConfig.project,
    {},
  );

  iam.serviceAccount.email.apply((email) =>
    createIAMMember(
      `${gcpConfig.encryptionKey.location}/${gcpConfig.encryptionKey.keyringId}/${gcpConfig.encryptionKey.cryptoKeyId}`,
      `serviceAccount:${email}`,
      'roles/cloudkms.cryptoKeyEncrypterDecrypter',
    ),
  );

  writeToDoppler(
    'GCP_CREDENTIALS',
    iam.key.privateKey,
    `${globalName}-cluster-home-assistant`,
  );
};
