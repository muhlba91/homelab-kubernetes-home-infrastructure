import * as aws from '@pulumi/aws';
import { all, Output } from '@pulumi/pulumi';

import { commonLabels, globalName } from '../configuration';
import { createAWSIamUserAndKey } from '../util/aws/iam_user';
import { writeToVault } from '../util/vault/secret';

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

  writeToVault(
    'home-assistant-telegraf-aws',
    all([iam.accessKey.id, iam.accessKey.secret]).apply(([keyId, secret]) =>
      JSON.stringify({ access_key_id: keyId, secret_access_key: secret }),
    ),
    `kubernetes-${globalName}-cluster`,
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
