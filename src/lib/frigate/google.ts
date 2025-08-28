import { all } from '@pulumi/pulumi';

import { ServiceAccountData } from '../../model/google/service_account_data';
import { bucketId, googleConfig, secretStoresConfig } from '../configuration';
import { createHmacKey } from '../google/iam/hmac';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Frigate GCP key.
 *
 * @returns {ServiceAccountData} the service account data
 */
export const createGCPKey = (): ServiceAccountData => {
  const iam = createGCPServiceAccountAndKey(
    'frigate',
    googleConfig.project,
    {},
  );

  writeToVault(
    'frigate-google-cloud',
    iam.key.privateKey.apply((key) => JSON.stringify({ credentials: key })),
    secretStoresConfig.vaultMount,
  );

  return iam;
};

/**
 * Creates the Frigate GCS key.
 *
 * @param {ServiceAccountData} iam the service account data
 */
export const createGCSKey = (iam: ServiceAccountData) => {
  iam.serviceAccount.email.apply((email) =>
    createGCSIAMMember(
      bucketId,
      `serviceAccount:${email}`,
      'roles/storage.objectAdmin',
    ),
  );

  const key = iam.serviceAccount.email.apply((email) => createHmacKey(email));

  writeToVault(
    'frigate-google-cloud-storage',
    all([key.accessId, key.secret]).apply(([accessKeyId, secretKey]) =>
      JSON.stringify({
        access_key_id: accessKeyId,
        secret_access_key: secretKey,
      }),
    ),
    secretStoresConfig.vaultMount,
  );
};
