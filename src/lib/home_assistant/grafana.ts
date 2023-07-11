import * as aws from '@pulumi/aws';
import { all, CustomResourceOptions, Output } from '@pulumi/pulumi';

import { AthenaWorkgroupData } from '../../model/aws/athena_workgroup_data';
import {
  clusterConfig,
  commonLabels,
  homeAssistantConfig,
} from '../configuration';
import { createAWSIamUserAndKey } from '../util/aws/iam_user';
import { writeToDoppler } from '../util/doppler/secret';

/**
 * Creates the Home Assistant Grafana AWS key.
 *
 * @param {AthenaWorkgroupData} athenaWorkgroup the Athena workgroup
 * @param {Output<string>} glueDatabaseArn the Glue database ARN
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const createGrafanaAWSAccessKey = async (
  athenaWorkgroup: AthenaWorkgroupData,
  glueDatabaseArn: Output<string>,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Promise<void> => {
  const policies = createAWSPolicies(glueDatabaseArn, athenaWorkgroup, {
    pulumiOptions: pulumiOptions,
  });
  const iam = policies.apply((iamPolicies) =>
    createAWSIamUserAndKey('home-assistant-grafana', {
      policies: iamPolicies,
      pulumiOptions: pulumiOptions,
    }),
  );

  writeToDoppler(
    'GRAFANA_AWS_ACCESS_KEY_ID',
    iam.accessKey.id,
    clusterConfig.name + '-cluster-home-assistant',
  );

  writeToDoppler(
    'GRAFANA_AWS_SECRET_ACCESS_KEY',
    iam.accessKey.secret,
    clusterConfig.name + '-cluster-home-assistant',
  );
};

/**
 * Creates the Home Assistant Grafana AWS policies.
 *
 * @param {Output<string>} glueDatabaseArn the Glue database ARN
 * @param {AthenaWorkgroupData} athenaWorkgroup the Athena workgroup
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
const createAWSPolicies = (
  glueDatabaseArn: Output<string>,
  athenaWorkgroup: AthenaWorkgroupData,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Output<aws.iam.Policy[]> => {
  return all([
    glueDatabaseArn,
    athenaWorkgroup.workgroup.arn,
    athenaWorkgroup.resultsBucket.arn,
  ]).apply(([databaseArn, workgroupArn, workgroupBucketArn]) => [
    new aws.iam.Policy(
      'aws-policy-homeassistant-grafana-athena-database',
      {
        policy: aws.iam
          .getPolicyDocument({
            statements: [
              {
                effect: 'Allow',
                actions: ['glue:GetDatabase', 'glue:GetDatabases'],
                resources: [
                  databaseArn,
                  `${databaseArn}/*`,
                  `${databaseArn.substring(
                    0,
                    databaseArn.lastIndexOf(':'),
                  )}:catalog`,
                ],
              },
              {
                effect: 'Allow',
                actions: [
                  'glue:GetTable',
                  'glue:GetTables',
                  'glue:GetPartition',
                  'glue:GetPartitions',
                  'glue:BatchGetPartition',
                ],
                resources: [
                  databaseArn,
                  `${databaseArn}/*`,
                  `${databaseArn.replace(':database/', ':table')}`,
                  `${databaseArn.replace(':database/', ':table/')}/*`,
                  `${databaseArn.substring(
                    0,
                    databaseArn.lastIndexOf(':'),
                  )}:catalog`,
                ],
              },
              {
                effect: 'Allow',
                actions: [
                  'athena:ListDatabases',
                  'athena:GetDatabase',
                  'athena:ListTableMetadata',
                  'athena:GetTableMetadata',
                  'athena:ListDataCatalogs',
                ],
                resources: ['*'],
              },
            ],
          })
          .then((doc) => doc.json),
        tags: commonLabels,
      },
      pulumiOptions,
    ),
    new aws.iam.Policy(
      'aws-policy-homeassistant-grafana-athena-data',
      {
        policy: aws.iam
          .getPolicyDocument({
            statements: [
              {
                effect: 'Allow',
                actions: ['s3:GetObject', 's3:ListBucket'],
                resources: [
                  homeAssistantConfig.bucketArn,
                  `${homeAssistantConfig.bucketArn}/*`,
                ],
              },
            ],
          })
          .then((doc) => doc.json),
        tags: commonLabels,
      },
      pulumiOptions,
    ),
    new aws.iam.Policy(
      'aws-policy-homeassistant-grafana-athena-workgroup',
      {
        policy: aws.iam
          .getPolicyDocument({
            statements: [
              {
                effect: 'Allow',
                actions: [
                  'athena:GetWorkGroup',
                  'athena:BatchGetQueryExecution',
                  'athena:GetQueryExecution',
                  'athena:ListQueryExecutions',
                  'athena:StartQueryExecution',
                  'athena:StopQueryExecution',
                  'athena:GetQueryResults',
                  'athena:GetQueryResultsStream',
                  'athena:CreateNamedQuery',
                  'athena:GetNamedQuery',
                  'athena:BatchGetNamedQuery',
                  'athena:ListNamedQueries',
                  'athena:DeleteNamedQuery',
                  'athena:CreatePreparedStatement',
                  'athena:GetPreparedStatement',
                  'athena:ListPreparedStatements',
                  'athena:UpdatePreparedStatement',
                  'athena:DeletePreparedStatement',
                ],
                resources: [workgroupArn, `${workgroupArn}/*`],
              },
              {
                effect: 'Allow',
                actions: ['athena:ListEngineVersions', 'athena:ListWorkGroups'],
                resources: ['*'],
              },
              {
                effect: 'Allow',
                actions: [
                  's3:GetBucketLocation',
                  's3:GetObject',
                  's3:ListBucket',
                  's3:ListBucketMultipartUploads',
                  's3:ListMultipartUploadParts',
                  's3:AbortMultipartUpload',
                  's3:PutObject',
                ],
                resources: [workgroupBucketArn, `${workgroupBucketArn}/*`],
              },
            ],
          })
          .then((doc) => doc.json),
        tags: commonLabels,
      },
      pulumiOptions,
    ),
  ]);
};
