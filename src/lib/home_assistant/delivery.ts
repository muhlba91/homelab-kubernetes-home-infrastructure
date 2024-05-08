import * as google from '@pulumi/gcp';
import { interpolate, Output } from '@pulumi/pulumi';
import { AssetArchive, FileAsset } from '@pulumi/pulumi/asset';

import { commonLabels, homeAssistantConfig } from '../configuration';

// https://github.com/influxdata/telegraf/blob/release-1.29/plugins/processors/strings/README.md
// https://github.com/influxdata/telegraf/blob/release-1.29/plugins/processors/execd/README.md
// https://github.com/influxdata/telegraf/tree/release-1.29/plugins/outputs/cloud_pubsub

/**
 * Creates the Home Assistant Cloud Delivery resources.
 */
export const createCloudDeliveryResources = () => {
  const topic = new google.pubsub.Topic(
    'gcp-pubsub-homeassistant-topic',
    {
      labels: commonLabels,
    },
    {},
  );
  createCloudFunctionProcessor(topic.id);
};

/**
 * Creates the Home Assistant Cloud Function processor.
 */
const createCloudFunctionProcessor = (topicId: Output<string>) => {
  const serviceAccount = new google.serviceaccount.Account(
    'gcp-sa-homeassistant-processor',
    {
      accountId: 'homeassistant-processor',
    },
    {},
  );
  new google.projects.IAMMember(
    'gcp-iam-member-homeassistant-processor-storage',
    {
      project: google.config.project ?? process.env.CLOUDSDK_CORE_PROJECT ?? '',
      role: 'roles/run.invoker',
      member: interpolate`serviceAccount:${serviceAccount.email}`,
    },
    {},
  );

  const sourceBucket = new google.storage.Bucket(
    'gcp-bucket-homeassistant-processor-source',
    {
      location:
        google.config.region ?? process.env.CLOUDSDK_COMPUTE_REGION ?? '',
      uniformBucketLevelAccess: true,
      forceDestroy: true,
    },
    {},
  );
  const source = new google.storage.BucketObject(
    'gcp-bucket-object-homeassistant-processor-source',
    {
      bucket: sourceBucket.name,
      source: new AssetArchive({
        'processor.py': new FileAsset(
          './assets/home_assistant/firehose/processor/processor.py',
        ),
      }),
    },
  );

  new google.cloudfunctionsv2.Function(
    'gcp-function-homeassistant-processor',
    {
      location:
        google.config.region ?? process.env.CLOUDSDK_COMPUTE_REGION ?? '',
      buildConfig: {
        runtime: 'python311',
        entryPoint: 'handler',
        source: {
          storageSource: {
            bucket: sourceBucket.name,
            object: source.name,
          },
        },
        environmentVariables: {},
      },
      serviceConfig: {
        availableMemory: `${homeAssistantConfig.firehose.lambda.memory}M`,
        timeoutSeconds: homeAssistantConfig.firehose.lambda.timeout,
        ingressSettings: 'ALLOW_INTERNAL_ONLY',
        allTrafficOnLatestRevision: true,
        serviceAccountEmail: serviceAccount.email,
      },
      eventTrigger: {
        triggerRegion:
          google.config.region ?? process.env.CLOUDSDK_COMPUTE_REGION ?? '',
        eventType: 'google.cloud.pubsub.topic.v1.messagePublished',
        pubsubTopic: topicId,
        retryPolicy: 'RETRY_POLICY_RETRY',
      },
      labels: commonLabels,
    },
    {},
  );
};
