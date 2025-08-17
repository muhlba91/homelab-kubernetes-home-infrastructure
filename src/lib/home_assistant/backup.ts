import { Output } from '@pulumi/pulumi';

import { backupBucketId, secretStoresConfig } from '../configuration';
import { BUCKET_PATH } from '../util/storage';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Home Assistant backup data.
 */
export const createHomeAssistantBackupConfiguration = () => {
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
