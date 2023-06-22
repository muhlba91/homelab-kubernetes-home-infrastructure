import * as aws from '@pulumi/aws';
import { CustomResourceOptions, Output, Resource } from '@pulumi/pulumi';

import {
  clusterConfig,
  commonLabels,
  environment,
  homeAssistantConfig,
} from '../configuration';
import { writeToDoppler } from '../util/doppler/secret';

/**
 * Creates the Home Assistant AWS Glue database.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Promise<Output<string>>} the database
 */
export const createGlueDatabase = async ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): Promise<Output<string>> => {
  const catalogDatabase = new aws.glue.CatalogDatabase(
    'aws-glue-database-home-assistant',
    {
      name: 'home-assistant-' + environment,
      tags: commonLabels,
    },
    pulumiOptions
  );

  createGlueCrawler(catalogDatabase.name, { pulumiOptions: pulumiOptions });

  writeToDoppler(
    'GRAFANA_GLUE_DATABASE',
    catalogDatabase.name,
    clusterConfig.name + '-cluster-home-assistant'
  );

  return catalogDatabase.arn;
};

/**
 * Creates the Home Assistant AWS Glue crawler.
 *
 * @param {Output<string>} catalogDatabaseName the database name
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Promise<Output<string>>} the database
 */
const createGlueCrawler = (
  catalogDatabaseName: Output<string>,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  }
) => {
  const bucketName = homeAssistantConfig.bucketArn.split(':::')[1];

  const crawlerRoleArn = createGlueCrawlerRole({
    pulumiOptions: pulumiOptions,
  });
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
    pulumiOptions
  );
};

/**
 * Creates the Home Assistant AWS Glue Crawler IAM Role.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Output<string>} the Role ARN
 */
const createGlueCrawlerRole = ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): Output<string> => {
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
    pulumiOptions
  );

  new aws.iam.RolePolicyAttachment(
    'aws-policy-attachment-homeassistant-glue-crawler-service',
    {
      role: crawlerRole.name,
      policyArn: aws.iam.ManagedPolicy.AWSGlueServiceRole,
    }
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
    pulumiOptions
  );

  new aws.iam.RolePolicyAttachment(
    'aws-policy-attachment-homeassistant-glue-crawler',
    {
      role: crawlerRole.name,
      policyArn: crawlerPolicy.arn,
    },
    {
      ...pulumiOptions,
      dependsOn: (
        (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
      ).concat(crawlerPolicy, crawlerRole),
    }
  );

  return crawlerRole.arn;
};
