import { Output } from '@pulumi/pulumi';

import { ServiceAccountData } from '../../model/google/service_account_data';
import {
  backupBucketId,
  gatesConfig,
  googleConfig,
  secretStoresConfig,
} from '../configuration';
import { createIAMMember } from '../google/kms/iam_member';
import { BUCKET_PATH } from '../util/storage';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Home Assistant resources.
 *
 * @param iam The service account data for Home Assistant.
 */
export const createHomeAssistantResources = (iam?: ServiceAccountData) => {
  if (!gatesConfig.homeAssistant || iam == undefined) {
    return;
  }

  iam.serviceAccount.email.apply((email) =>
    createIAMMember(
      `${googleConfig.encryptionKey.location}/${googleConfig.encryptionKey.keyringId}/${googleConfig.encryptionKey.cryptoKeyId}`,
      `serviceAccount:${email}`,
      'roles/cloudkms.cryptoKeyEncrypterDecrypter',
    ),
  );

  writeToVault(
    'home-assistant-backup-configuration',
    Output.create(
      JSON.stringify({
        bucket_name: backupBucketId,
        bucket_path: `${BUCKET_PATH}/home-assistant`,
        bucket_reference: `${backupBucketId}/${BUCKET_PATH}/home-assistant`,
      }),
    ),
    secretStoresConfig.vaultMount,
  );
};
