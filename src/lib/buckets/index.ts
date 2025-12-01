import * as google from '@pulumi/google-native';
import { all, Output } from '@pulumi/pulumi';

import { ServiceAccountData } from '../../model/google/service_account_data';
import { StringMap } from '../../model/map';
import {
  backupBucketId,
  bucketId,
  bucketsConfig,
  commonLabels,
  environment,
  gcpDefaultRegion,
  googleConfig,
  secretStoresConfig,
} from '../configuration';
import { createHmacKey } from '../google/iam/hmac';
import { createGCSIAMMember } from '../google/storage/iam_member';
import { createGCPServiceAccountAndKey } from '../util/google/service_account_user';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the S3 bucket resources.
 *
 * @returns a map of service account data for each bucket.
 */
export const createBuckets = (): StringMap<ServiceAccountData> => {
  return Object.fromEntries(
    Object.entries(bucketsConfig?.gcs ?? {}).map(([name, bucketConfig]) => {
      // eslint-disable-next-line functional/no-let
      let bucket = Output.create(name);

      const iam = createGCPServiceAccountAndKey(name, googleConfig.project, {});

      const key = iam.serviceAccount.email.apply((email) =>
        createHmacKey(email),
      );

      if (bucketConfig.defaultBucket) {
        bucket = new google.storage.v1.Bucket(`gcs-bucket-${name}`, {
          name: bucketConfig.defaultName
            ? `${bucketConfig.defaultName}-${environment}`
            : undefined,
          location: gcpDefaultRegion,
          labels: commonLabels,
          cors: bucketConfig.cors ? [bucketConfig.cors] : undefined,
        }).name;
      }
      if (bucketConfig?.mainBucket) {
        bucket = Output.create(bucketId);
      }
      if (bucketConfig?.backupBucket) {
        bucket = Output.create(backupBucketId);
      }

      all([bucket, iam.serviceAccount.email]).apply(([bucketRef, email]) => {
        createGCSIAMMember(
          bucketRef,
          `serviceAccount:${email}`,
          'roles/storage.objectAdmin',
        );
        createGCSIAMMember(
          bucketRef,
          `serviceAccount:${email}`,
          'roles/storage.legacyBucketOwner',
        );
      });

      writeToVault(
        `${bucketConfig.vaultPath ?? name}-google-cloud`,
        all([iam.key.privateKey, bucket]).apply(([key, bucketRef]) =>
          JSON.stringify({
            credentials: key,
            bucket: bucketRef,
          }),
        ),
        secretStoresConfig.vaultMount,
      );

      writeToVault(
        `${bucketConfig.vaultPath ?? name}-google-cloud-storage`,
        all([key.accessId, key.secret, bucket]).apply(
          ([accessKeyId, secretKey, bucketRef]) =>
            JSON.stringify({
              access_key_id: accessKeyId,
              secret_access_key: secretKey,
              bucket: bucketRef,
            }),
        ),
        secretStoresConfig.vaultMount,
      );

      return [name, iam];
    }),
  );
};
