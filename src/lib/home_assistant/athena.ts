import * as aws from '@pulumi/aws';
import { CustomResourceOptions, interpolate } from '@pulumi/pulumi';

import { AthenaWorkgroupData } from '../../model/aws/athena_workgroup_data';
import {
  clusterConfig,
  commonLabels,
  environment,
  homeAssistantConfig,
} from '../configuration';
import { writeToDoppler } from '../util/doppler/secret';

/**
 * Creates the Home Assistant AWS Athena.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Promise<AthenaWorkgroupData>} the Athena workgroup
 */
export const createAthenaWorkgroup = async ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): Promise<AthenaWorkgroupData> => {
  const workgroup = createWorkgroup({
    pulumiOptions: pulumiOptions,
  });

  writeToDoppler(
    'GRAFANA_ATHENA_WORKGROUP',
    workgroup.workgroup.name,
    clusterConfig.name + '-cluster-home-assistant'
  );

  return workgroup;
};

/**
 * Creates the Athena workgroup.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {AthenaWorkgroupData} the Athena workgroup
 */
const createWorkgroup = ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): AthenaWorkgroupData => {
  const resultsBucket = new aws.s3.Bucket(
    'aws-s3-athena-workgroup-home-assistant-results',
    {
      bucketPrefix: 'home-assistant-athena-results-' + environment,
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
    pulumiOptions
  );

  const workgroup = new aws.athena.Workgroup(
    'aws-athena-workgroup-home-assistant',
    {
      name: 'home-assistant-' + environment,
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
    pulumiOptions
  );

  return {
    resultsBucket: resultsBucket,
    workgroup: workgroup,
  };
};
