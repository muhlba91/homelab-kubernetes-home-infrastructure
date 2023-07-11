import * as aws from '@pulumi/aws';
import {
  CustomResourceOptions,
  interpolate,
  Output,
  Resource,
} from '@pulumi/pulumi';
import { AssetArchive, FileAsset } from '@pulumi/pulumi/asset';

import {
  clusterConfig,
  commonLabels,
  environment,
  homeAssistantConfig,
} from '../configuration';
import { writeToDoppler } from '../util/doppler/secret';

/**
 * Creates the Home Assistant Kinesis Data Firehose Delivery Stream.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Promise<Output<string>>} the stream ARN
 */
export const createFirehose = async ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): Promise<Output<string>> => {
  const lambdaProcessorArn = createLambda({ pulumiOptions: pulumiOptions });
  const deliveryStream = createDeliveryStream(lambdaProcessorArn, {
    pulumiOptions: pulumiOptions,
  });

  writeToDoppler(
    'TELEGRAF_FIREHOSE_DELIVERY_STREAM',
    deliveryStream.name,
    clusterConfig.name + '-cluster-home-assistant',
  );

  return deliveryStream.arn;
};

/**
 * Creates the Home Assistant Kinesis Data Firehose Processor Lambda IAM Role.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Output<string>} the Role ARN
 */
const createLambdaRole = ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): Output<string> => {
  const lambdaRole = new aws.iam.Role(
    'aws-role-homeassistant-firehose-lambda',
    {
      assumeRolePolicy: aws.iam
        .getPolicyDocument({
          statements: [
            {
              effect: 'Allow',
              principals: [
                {
                  type: 'Service',
                  identifiers: ['lambda.amazonaws.com'],
                },
              ],
              actions: ['sts:AssumeRole'],
            },
          ],
        })
        .then((doc) => doc.json),
      tags: commonLabels,
    },
    pulumiOptions,
  );

  new aws.iam.RolePolicyAttachment(
    'aws-policy-attachment-homeassistant-firehose-lambda-execution',
    {
      role: lambdaRole.name,
      policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
    },
  );

  return lambdaRole.arn;
};

/**
 * Creates the Home Assistant Kinesis Data Firehose Processor Lambda.
 *
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Output<string>} the Lambda ARN
 */
const createLambda = ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): Output<string> => {
  const lambdaRoleArn = createLambdaRole({ pulumiOptions: pulumiOptions });

  const lambdaProcessor = new aws.lambda.Function(
    'aws-lambda-homeassistant-firehose-processor',
    {
      architectures: ['arm64'],
      role: lambdaRoleArn,
      memorySize: homeAssistantConfig.firehose.lambda.memory,
      timeout: homeAssistantConfig.firehose.lambda.timeout,
      publish: true,
      code: new AssetArchive({
        'processor.py': new FileAsset(
          './assets/home_assistant/firehose/processor/processor.py',
        ),
      }),
      handler: 'processor.lambda_handler',
      runtime: 'python3.10',
      tags: commonLabels,
    },
    pulumiOptions,
  );

  return lambdaProcessor.arn;
};

/**
 * Creates the Home Assistant Kinesis Data Firehose Delivery Stream IAM Role.
 *
 * @param {Output<string>} lambdaArn the Processor Lambda ARN
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Output<string>} the Role ARN
 */
const createDeliveryStreamRole = (
  lambdaArn: Output<string>,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Output<string> => {
  const firehoseRole = new aws.iam.Role(
    'aws-role-homeassistant-firehose',
    {
      assumeRolePolicy: aws.iam
        .getPolicyDocument({
          statements: [
            {
              effect: 'Allow',
              principals: [
                {
                  type: 'Service',
                  identifiers: ['firehose.amazonaws.com'],
                },
              ],
              actions: ['sts:AssumeRole'],
            },
          ],
        })
        .then((doc) => doc.json),
      tags: commonLabels,
    },
    pulumiOptions,
  );

  const firehosePolicy = lambdaArn.apply(
    (lambdaProcessorArn) =>
      new aws.iam.Policy(
        'aws-policy-homeassistant-firehose',
        {
          policy: aws.iam
            .getPolicyDocument({
              statements: [
                {
                  effect: 'Allow',
                  actions: [
                    's3:AbortMultipartUpload',
                    's3:GetBucketLocation',
                    's3:GetObject',
                    's3:ListBucket',
                    's3:ListBucketMultipartUploads',
                    's3:PutObject',
                  ],
                  resources: [
                    homeAssistantConfig.bucketArn,
                    homeAssistantConfig.bucketArn + '/*',
                  ],
                },
                {
                  effect: 'Allow',
                  actions: [
                    'lambda:InvokeFunction',
                    'lambda:GetFunctionConfiguration',
                  ],
                  resources: [lambdaProcessorArn + ':$LATEST'],
                },
              ],
            })
            .then((doc) => doc.json),
          tags: commonLabels,
        },
        pulumiOptions,
      ),
  );

  firehosePolicy.apply(
    (policy) =>
      new aws.iam.RolePolicyAttachment(
        'aws-policy-attachment-homeassistant-firehose',
        {
          role: firehoseRole.name,
          policyArn: policy.arn,
        },
        {
          ...pulumiOptions,
          dependsOn: (
            (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
          ).concat(policy, firehoseRole),
        },
      ),
  );

  return firehoseRole.arn;
};

/**
 * Creates the Home Assistant Kinesis Data Firehose Delivery Stream.
 *
 * @param {Output<string>} lambdaArn the Processor Lambda ARN
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {aws.kinesis.FirehoseDeliveryStream} the stream
 */
const createDeliveryStream = (
  lambdaArn: Output<string>,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): aws.kinesis.FirehoseDeliveryStream => {
  const firehoseRoleArn = createDeliveryStreamRole(lambdaArn, {
    pulumiOptions: pulumiOptions,
  });

  const lambdaParameters = [
    {
      parameterName: 'LambdaArn',
      parameterValue: interpolate`${lambdaArn}:$LATEST`,
    },
    {
      parameterName: 'BufferIntervalInSeconds',
      parameterValue: Output.create(
        homeAssistantConfig.firehose.lambda.buffer.interval.toString(),
      ),
    },
    {
      parameterName: 'BufferSizeInMBs',
      parameterValue: Output.create(
        homeAssistantConfig.firehose.lambda.buffer.size.toString(),
      ),
    },
  ];

  const deliveryStream = new aws.kinesis.FirehoseDeliveryStream(
    'aws-firehose-homeassistant-stream',
    {
      destination: 'extended_s3',
      serverSideEncryption: {
        enabled: true,
        keyType: 'AWS_OWNED_CMK',
      },
      extendedS3Configuration: {
        roleArn: firehoseRoleArn,
        bucketArn: homeAssistantConfig.bucketArn,
        bufferSize: homeAssistantConfig.firehose.buffer.size,
        bufferInterval: homeAssistantConfig.firehose.buffer.interval,
        compressionFormat: homeAssistantConfig.firehose.compression,
        dynamicPartitioningConfiguration: {
          enabled: true,
        },
        prefix: `${environment}/data/year=!{partitionKeyFromLambda:year}/month=!{partitionKeyFromLambda:month}/day=!{partitionKeyFromLambda:day}/`,
        errorOutputPrefix: `${environment}/errors/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/!{firehose:error-output-type}/`,
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: 'RecordDeAggregation',
              parameters: [
                {
                  parameterName: 'SubRecordType',
                  parameterValue: 'JSON',
                },
              ],
            },
            {
              type: 'Lambda',
              parameters: lambdaParameters,
            },
            {
              type: 'AppendDelimiterToRecord',
            },
          ],
        },
      },
      tags: commonLabels,
    },
  );

  return deliveryStream;
};
