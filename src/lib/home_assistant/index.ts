import { gatesConfig } from '../configuration';

import { createHomeAssistantBackupConfiguration } from './backup';
import { createHomeAssistantEmqx } from './emqx';
import { createGCPKey, createGCSKey } from './google';
import { createHomeAssistantInfluxDb } from './influxdb';

/**
 * Creates the Home Assistant resources.
 */
export const createHomeAssistantResources = () => {
  if (!gatesConfig.homeAssistant) {
    return;
  }

  const iam = createGCPKey();
  createGCSKey(iam);

  createHomeAssistantInfluxDb();
  createHomeAssistantEmqx();
  createHomeAssistantBackupConfiguration();
};
