import { all } from '@pulumi/pulumi';

import { ServiceAccountData } from '../../model/google/service_account_data';
import {
  backupBucketId,
  googleConfig,
  secretStoresConfig,
} from '../configuration';
import { createHmacKey } from '../google/iam/hmac';
import { createIAMMember } from '../google/kms/iam_member';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Home Assistant GCP key.
 *
 * @returns {ServiceAccountData} the service account data
 */
export const createGCPKey = (): ServiceAccountData => {
  const iam = createGCPServiceAccountAndKey(
    'home-assistant',
    googleConfig.project,
    {},
  );

  iam.serviceAccount.email.apply((email) =>
    createIAMMember(
      `${googleConfig.encryptionKey.location}/${googleConfig.encryptionKey.keyringId}/${googleConfig.encryptionKey.cryptoKeyId}`,
      `serviceAccount:${email}`,
      'roles/cloudkms.cryptoKeyEncrypterDecrypter',
    ),
  );

  writeToVault(
    'home-assistant-google-cloud',
    iam.key.privateKey.apply((key) => JSON.stringify({ credentials: key })),
    secretStoresConfig.vaultMount,
  );

  return iam;
};

/**
 * Creates the Home Assistant GCS key.
 *
 * @param {ServiceAccountData} iam the service account data
 */
export const createGCSKey = (iam: ServiceAccountData) => {
  iam.serviceAccount.email.apply((email) =>
    createGCSIAMMember(
      backupBucketId,
      `serviceAccount:${email}`,
      'roles/storage.objectAdmin',
    ),
  );

  const key = iam.serviceAccount.email.apply((email) => createHmacKey(email));

  writeToVault(
    'home-assistant-google-cloud-storage',
    all([key.accessId, key.secret]).apply(([accessKeyId, secretKey]) =>
      JSON.stringify({
        access_key_id: accessKeyId,
        secret_access_key: secretKey,
      }),
    ),
    secretStoresConfig.vaultMount,
  );
};
