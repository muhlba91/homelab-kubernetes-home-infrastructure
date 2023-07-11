import { CustomResourceOptions } from '@pulumi/pulumi';

import { createAthenaWorkgroup } from './athena';
import { createFirehose } from './firehose';
import { createGCPKey } from './gcp';
import { createGlueDatabase } from './glue';
import { createGrafanaAWSAccessKey } from './grafana';
import { createTelegrafAWSAccessKey } from './telegraf';

/**
 * Creates the Home Assistant resources.
 *
 * @param {string} gcpProject the GCP project
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const createHomeAssistantResources = async (
  gcpProject: string,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Promise<void> => {
  await createGCPKey(gcpProject, { pulumiOptions: pulumiOptions });

  const firehoseDeliveryStreamArn = await createFirehose({
    pulumiOptions: pulumiOptions,
  });
  await createTelegrafAWSAccessKey(firehoseDeliveryStreamArn, {
    pulumiOptions: pulumiOptions,
  });

  const glueDatabaseArn = await createGlueDatabase({
    pulumiOptions: pulumiOptions,
  });
  const athenaWorkgroup = await createAthenaWorkgroup({
    pulumiOptions: pulumiOptions,
  });
  await createGrafanaAWSAccessKey(athenaWorkgroup, glueDatabaseArn, {
    pulumiOptions: pulumiOptions,
  });
};
