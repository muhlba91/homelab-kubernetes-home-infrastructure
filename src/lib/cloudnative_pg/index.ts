import { Output } from '@pulumi/pulumi';

import { backupBucketId, gcpConfig, globalName } from '../configuration';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { writeToDoppler } from '../util/doppler/secret';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the CloudNativePG resources.
 */
export const createCloudNativePGResources = () => {
  const iam = createGCPServiceAccountAndKey(
    'cloudnative-pg',
    gcpConfig.project,
    {},
  );

  iam.serviceAccount.email.apply((email) =>
    createGCSIAMMember(
      backupBucketId,
      `serviceAccount:${email}`,
      'roles/storage.objectAdmin',
    ),
  );

  writeToDoppler(
    'GCP_CREDENTIALS',
    iam.key.privateKey,
    `${globalName}-cluster-cloudnativepg`,
  );
  writeToDoppler(
    'GCP_BUCKET_ID',
    Output.create(backupBucketId),
    `${globalName}-cluster-cloudnativepg`,
  );

  writeToVault(
    'cloudnativepg-google-cloud',
    iam.key.privateKey.apply((key) =>
      JSON.stringify({ credentials: key, bucket: backupBucketId }),
    ),
    `kubernetes-${globalName}-cluster`,
  );
};
