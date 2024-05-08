import * as aws from '@pulumi/aws';
import { Output } from '@pulumi/pulumi';

/**
 * Defines data for an IAM user.
 */
export interface IamUserData {
  readonly user: aws.iam.User;
  readonly accessKey: Output<aws.iam.AccessKey>;
}
