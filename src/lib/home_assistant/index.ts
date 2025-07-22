import { createGCPKey, createGCSKey } from './google';

/**
 * Creates the Home Assistant resources.
 */
export const createHomeAssistantResources = () => {
  const iam = createGCPKey();
  createGCSKey(iam);
};
