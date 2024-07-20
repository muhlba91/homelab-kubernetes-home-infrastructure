import { backupBucketId, globalName, googleConfig } from '../configuration';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the CloudNativePG resources.
 */
export const createCloudNativePGResources = () => {
  const iam = createGCPServiceAccountAndKey(
    'cloudnative-pg',
    googleConfig.project,
    {},
  );

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
    'cloudnativepg-google-cloud',
    iam.key.privateKey.apply((key) =>
      JSON.stringify({ credentials: key, bucket: backupBucketId }),
    ),
    `kubernetes-${globalName}-cluster`,
  );
};
