import { gatesConfig } from '../configuration';

import { createGCPKey, createGCSKey } from './google';

/**
 * Creates the Frigate resources.
 */
export const createFrigateResources = () => {
  if (!gatesConfig.frigate) {
    return;
  }

  const iam = createGCPKey();
  createGCSKey(iam);
};
