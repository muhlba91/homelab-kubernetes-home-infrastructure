import { all } from '@pulumi/pulumi';

import { ServiceAccountData } from '../../model/google/service_account_data';
import { backupBucketId, gcpConfig, globalName } from '../configuration';
import { createHmacKey } from '../google/iam/hmac';
import { createIAMMember } from '../google/kms/iam_member';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { writeToDoppler } from '../util/doppler/secret';
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

  writeToVault(
    'home-assistant-google-cloud',
    iam.key.privateKey.apply((key) => JSON.stringify({ credentials: key })),
    `kubernetes-${globalName}-cluster`,
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

  writeToDoppler(
    'GCS_ACCESS_KEY_ID',
    key.accessId,
    `${globalName}-cluster-home-assistant`,
  );

  writeToDoppler(
    'GCS_SECRET_ACCESS_KEY',
    key.secret,
    `${globalName}-cluster-home-assistant`,
  );

  writeToVault(
    'home-assistant-google-cloud-storage',
    all([key.accessId, key.secret]).apply(([accessKeyId, secretKey]) =>
      JSON.stringify({
        access_key_id: accessKeyId,
        secret_access_key: secretKey,
      }),
    ),
    `kubernetes-${globalName}-cluster`,
  );
};
