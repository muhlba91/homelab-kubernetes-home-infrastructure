import { backupBucketId, gcpConfig, globalName } from '../configuration';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the velero resources.
 */
export const createVeleroResources = () => {
  const iam = createGCPServiceAccountAndKey('velero', gcpConfig.project, {});

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
    `kubernetes-${globalName}-cluster`,
  );
};
