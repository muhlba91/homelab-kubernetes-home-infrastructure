import * as aws from '@pulumi/aws';
import { Output } from '@pulumi/pulumi';

import { commonLabels, globalName } from '../configuration';
import { createAWSIamUserAndKey } from '../util/aws/iam_user';
import { writeToDoppler } from '../util/doppler/secret';

/**
 * Creates the Home Assistant Telegraf AWS key.
 *
 * @param {Output<string>} firehoseDeliveryStreamArn the delivery stream ARN
 */
export const createTelegrafAWSAccessKey = (
  firehoseDeliveryStreamArn: Output<string>,
) => {
  const policies = createAWSPolicies(firehoseDeliveryStreamArn);
  const iam = policies.apply((iamPolicies) =>
    createAWSIamUserAndKey('home-assistant-telegraf', {
      policies: iamPolicies,
    }),
  );

  writeToDoppler(
    'TELEGRAF_AWS_ACCESS_KEY_ID',
    iam.accessKey.id,
    `${globalName}-cluster-home-assistant`,
  );

  writeToDoppler(
    'TELEGRAF_AWS_SECRET_ACCESS_KEY',
    iam.accessKey.secret,
    `${globalName}-cluster-home-assistant`,
  );
};

/**
 * Creates the Home Assistant Telegraf AWS policies.
 *
 * @param {Output<string>} firehoseStreamArn the Firehose stream ARN
 */
const createAWSPolicies = (
  firehoseStreamArn: Output<string>,
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
      {},
    ),
  ]);
};
