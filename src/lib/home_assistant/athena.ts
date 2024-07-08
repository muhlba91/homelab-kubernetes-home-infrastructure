import * as aws from '@pulumi/aws';
import { interpolate } from '@pulumi/pulumi';

import { AthenaWorkgroupData } from '../../model/aws/athena_workgroup_data';
import {
  commonLabels,
  environment,
  globalName,
  homeAssistantConfig,
} from '../configuration';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Home Assistant AWS Athena.
 *
 * @returns {AthenaWorkgroupData} the Athena workgroup
 */
export const createAthenaWorkgroup = (): AthenaWorkgroupData => {
  const workgroup = createWorkgroup();

  writeToVault(
    'home-assistant-grafana-athena',
    workgroup.workgroup.name.apply((name) =>
      JSON.stringify({ workgroup: name }),
    ),
    `kubernetes-${globalName}-cluster`,
  );

  return workgroup;
};

/**
 * Creates the Athena workgroup.
 *
 * @returns {AthenaWorkgroupData} the Athena workgroup
 */
const createWorkgroup = (): AthenaWorkgroupData => {
  const resultsBucket = new aws.s3.Bucket(
    'aws-s3-athena-workgroup-home-assistant-results',
    {
      bucketPrefix: `home-assistant-athena-results-${environment}-`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRules: [
        {
          enabled: true,
          abortIncompleteMultipartUploadDays: 1,
          expiration: {
            days: homeAssistantConfig.athena.resultsExpiryInDays,
          },
        },
      ],
      forceDestroy: true,
      tags: commonLabels,
    },
    {},
  );

  const workgroup = new aws.athena.Workgroup(
    'aws-athena-workgroup-home-assistant',
    {
      name: `home-assistant-${environment}`,
      forceDestroy: true,
      configuration: {
        enforceWorkgroupConfiguration: true,
        publishCloudwatchMetricsEnabled: false,
        resultConfiguration: {
          outputLocation: interpolate`s3://${resultsBucket.bucket}/output/`,
          aclConfiguration: {
            s3AclOption: 'BUCKET_OWNER_FULL_CONTROL',
          },
        },
        bytesScannedCutoffPerQuery:
          homeAssistantConfig.athena.bytesScannedCutoffPerQuery,
      },
      tags: commonLabels,
    },
    {},
  );

  return {
    resultsBucket: resultsBucket,
    workgroup: workgroup,
  };
};
