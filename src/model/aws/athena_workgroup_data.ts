import * as aws from '@pulumi/aws';

/**
 * Defines data for an Athena workgroup.
 */
export type AthenaWorkgroupData = {
  readonly workgroup: aws.athena.Workgroup;
  readonly resultsBucket: aws.s3.Bucket;
};
