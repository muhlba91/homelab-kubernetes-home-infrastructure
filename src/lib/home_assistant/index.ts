import { gatesConfig } from '../configuration';

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
};
