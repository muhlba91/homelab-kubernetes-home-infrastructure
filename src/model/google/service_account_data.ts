import * as gcp from '@pulumi/gcp';
import * as google from '@pulumi/google-native';

/**
 * Defines data for an service account.
 */
export interface ServiceAccountData {
  readonly serviceAccount: google.iam.v1.ServiceAccount;
  readonly key: gcp.serviceaccount.Key;
}
