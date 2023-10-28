import { createAthenaWorkgroup } from './athena';
import { createFirehose } from './firehose';
import { createGlueDatabase } from './glue';
import { createGCPKey } from './google';
import { createGrafanaAWSAccessKey } from './grafana';
import { createTelegrafAWSAccessKey } from './telegraf';

/**
 * Creates the Home Assistant resources.
 */
export const createHomeAssistantResources = () => {
  createGCPKey();

  const firehoseDeliveryStreamArn = createFirehose();
  createTelegrafAWSAccessKey(firehoseDeliveryStreamArn);

  const glueDatabaseArn = createGlueDatabase();
  const athenaWorkgroup = createAthenaWorkgroup();
  createGrafanaAWSAccessKey(athenaWorkgroup, glueDatabaseArn);
};
