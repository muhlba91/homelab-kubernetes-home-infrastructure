import * as aws from '@pulumi/aws';
import { Output } from '@pulumi/pulumi';

import {
  commonLabels,
  environment,
  globalName,
  homeAssistantConfig,
} from '../configuration';
import { writeToDoppler } from '../util/doppler/secret';
import { writeToVault } from '../util/vault/secret';

/**
 * Creates the Home Assistant AWS Glue database.
 *
 * @returns {Output<string>} the database
 */
export const createGlueDatabase = (): Output<string> => {
  const catalogDatabase = new aws.glue.CatalogDatabase(
    'aws-glue-database-home-assistant',
    {
      name: `home-assistant-${environment}`,
      tags: commonLabels,
    },
    {},
  );

  createGlueCrawler(catalogDatabase.name);

  writeToDoppler(
    'GRAFANA_GLUE_DATABASE',
    catalogDatabase.name,
    `${globalName}-cluster-home-assistant`,
  );

  writeToVault(
    'home-assistant-grafana-glue',
    catalogDatabase.name.apply((name) => JSON.stringify({ database: name })),
    `kubernetes-${globalName}-cluster`,
  );

  return catalogDatabase.arn;
};

/**
 * Creates the Home Assistant AWS Glue crawler.
 *
 * @param {Output<string>} catalogDatabaseName the database name
 * @returns {Promise<Output<string>>} the database
 */
const createGlueCrawler = (catalogDatabaseName: Output<string>) => {
  const bucketName = homeAssistantConfig.bucketArn.split(':::')[1];

  const crawlerRoleArn = createGlueCrawlerRole();
  new aws.glue.Crawler(
    'aws-glue-crawler-home-assistant',
    {
      databaseName: catalogDatabaseName,
      role: crawlerRoleArn,
      schedule: homeAssistantConfig.glue.schedule,
      configuration: JSON.stringify({
        Grouping: {
          TableGroupingPolicy: 'CombineCompatibleSchemas',
        },
        CrawlerOutput: {
          Partitions: {
            AddOrUpdateBehavior: 'InheritFromTable',
          },
        },
        CreatePartitionIndex: true,
        Version: 1,
      }),
      s3Targets: [
        {
          path: `s3://${bucketName}/${environment}/data/`,
        },
      ],
      tags: commonLabels,
    },
    {},
  );
};

/**
 * Creates the Home Assistant AWS Glue Crawler IAM Role.
 *
 * @returns {Output<string>} the Role ARN
 */
const createGlueCrawlerRole = (): Output<string> => {
  const crawlerRole = new aws.iam.Role(
    'aws-role-homeassistant-glue-crawler',
    {
      assumeRolePolicy: aws.iam
        .getPolicyDocument({
          statements: [
            {
              effect: 'Allow',
              principals: [
                {
                  type: 'Service',
                  identifiers: ['glue.amazonaws.com'],
                },
              ],
              actions: ['sts:AssumeRole'],
            },
          ],
        })
        .then((doc) => doc.json),
      tags: commonLabels,
    },
    {},
  );

  new aws.iam.RolePolicyAttachment(
    'aws-policy-attachment-homeassistant-glue-crawler-service',
    {
      role: crawlerRole.name,
      policyArn: aws.iam.ManagedPolicy.AWSGlueServiceRole,
    },
  );

  const crawlerPolicy = new aws.iam.Policy(
    'aws-policy-homeassistant-glue-crawler',
    {
      policy: aws.iam
        .getPolicyDocument({
          statements: [
            {
              effect: 'Allow',
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                homeAssistantConfig.bucketArn,
                homeAssistantConfig.bucketArn + '/*',
              ],
            },
          ],
        })
        .then((doc) => doc.json),
      tags: commonLabels,
    },
    {},
  );

  new aws.iam.RolePolicyAttachment(
    'aws-policy-attachment-homeassistant-glue-crawler',
    {
      role: crawlerRole.name,
      policyArn: crawlerPolicy.arn,
    },
    {
      dependsOn: [crawlerPolicy, crawlerRole],
    },
  );

  return crawlerRole.arn;
};
