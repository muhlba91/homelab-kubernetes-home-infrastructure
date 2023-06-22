import * as aws from '@pulumi/aws';
import { CustomResourceOptions, Output } from '@pulumi/pulumi';

import { clusterConfig, commonLabels } from '../configuration';
import { createAWSIamUserAndKey } from '../util/aws/iam_user';
import { writeToDoppler } from '../util/doppler/secret';

/**
 * Creates the Home Assistant Telegraf AWS key.
 *
 * @param {Output<string>} firehoseDeliveryStreamArn the delivery stream ARN
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const createTelegrafAWSAccessKey = async (
  firehoseDeliveryStreamArn: Output<string>,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  }
): Promise<void> => {
  const policies = createAWSPolicies(firehoseDeliveryStreamArn, {
    pulumiOptions: pulumiOptions,
  });
  const iam = policies.apply((iamPolicies) =>
    createAWSIamUserAndKey('home-assistant-telegraf', {
      policies: iamPolicies,
      pulumiOptions: pulumiOptions,
    })
  );

  writeToDoppler(
    'TELEGRAF_AWS_ACCESS_KEY_ID',
    iam.accessKey.id,
    clusterConfig.name + '-cluster-home-assistant'
  );

  writeToDoppler(
    'TELEGRAF_AWS_SECRET_ACCESS_KEY',
    iam.accessKey.secret,
    clusterConfig.name + '-cluster-home-assistant'
  );
};

/**
 * Creates the Home Assistant Telegraf AWS policies.
 *
 * @param {Output<string>} firehoseStreamArn the Firehose stream ARN
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
const createAWSPolicies = (
  firehoseStreamArn: Output<string>,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  }
): Output<aws.iam.Policy[]> => {
  return firehoseStreamArn.apply((firehoseArn) => [
    new aws.iam.Policy(
      'aws-policy-homeassistant-telegraf-firehose-stream',
      {
        policy: aws.iam
          .getPolicyDocument({
            statements: [
              {
                effect: 'Allow',
                actions: ['firehose:PutRecord', 'firehose:PutRecordBatch'],
                resources: [firehoseArn],
              },
              {
                effect: 'Allow',
                actions: ['firehose:DescribeDeliveryStream'],
                resources: ['*'],
              },
            ],
          })
          .then((doc) => doc.json),
        tags: commonLabels,
      },
      pulumiOptions
    ),
  ]);
};
