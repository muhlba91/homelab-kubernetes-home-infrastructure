import {
  backupBucketId,
  gatesConfig,
  googleConfig,
  secretStoresConfig,
} from '../configuration';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the velero resources.
 */
export const createVeleroResources = () => {
  if (!gatesConfig.velero) {
    return;
  }

  const iam = createGCPServiceAccountAndKey('velero', googleConfig.project, {});

  iam.serviceAccount.email.apply((email) => {
    createGCSIAMMember(
      backupBucketId,
      `serviceAccount:${email}`,
      'roles/storage.objectAdmin',
    );
    createGCSIAMMember(
      backupBucketId,
      `serviceAccount:${email}`,
      'roles/storage.legacyBucketOwner',
    );
  });

  writeToVault(
    'velero-google-cloud',
    iam.key.privateKey.apply((key) =>
      JSON.stringify({ credentials: key, bucket: backupBucketId }),
    ),
    secretStoresConfig.vaultMount,
  );
};
