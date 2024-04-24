import { Output } from '@pulumi/pulumi';

import { bucketId, gcpConfig, globalName } from '../configuration';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { writeToDoppler } from '../util/doppler/secret';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the velero resources.
 */
export const createVeleroResources = () => {
  const iam = createGCPServiceAccountAndKey('velero', gcpConfig.project, {});

  iam.serviceAccount.email.apply((email) =>
    createGCSIAMMember(
      bucketId,
      `serviceAccount:${email}`,
      'roles/storage.objectAdmin',
    ),
  );

  writeToDoppler(
    'GCP_CREDENTIALS',
    iam.key.privateKey,
    `${globalName}-cluster-velero`,
  );
  writeToDoppler(
    'GCP_BUCKET_ID',
    Output.create(bucketId),
    `${globalName}-cluster-velero`,
  );

  writeToVault(
    'velero-google-cloud',
    iam.key.privateKey.apply((key) =>
      JSON.stringify({ credentials: key, bucket: bucketId }),
    ),
    `kubernetes-${globalName}-cluster`,
  );
};
