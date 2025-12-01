import { StringMap } from '../map';

/**
 * Defines configuration data for S3 buckets.
 */
export interface BucketsConfig {
  readonly gcs?: StringMap<BucketConfig>;
}

/**
 * Defines configuration data for an S3 bucket.
 *
 * Attention: currently only one bucket is supported!
 */
export interface BucketConfig {
  readonly vaultPath?: string;
  readonly defaultBucket?: boolean;
  readonly mainBucket?: boolean;
  readonly backupBucket?: boolean;
}
