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
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 */
export const createHomeAssistantResources = async ({
  pulumiOptions,
}: {
  readonly pulumiOptions?: CustomResourceOptions;
}): Promise<void> => {
  await createGCPKey({ pulumiOptions: pulumiOptions });

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
