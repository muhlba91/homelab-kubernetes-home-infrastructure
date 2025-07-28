import { gatesConfig } from '../configuration';

import { createGCPKey, createGCSKey } from './google';

/**
 * Creates the Home Assistant resources.
 */
export const createHomeAssistantResources = () => {
  if (!gatesConfig.homeAssistant) {
    return;
  }

  const iam = createGCPKey();
  createGCSKey(iam);
};
