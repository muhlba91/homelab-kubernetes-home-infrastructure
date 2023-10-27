import * as kubernetes from '@pulumi/kubernetes';

import { deploySecrets } from './secrets';
import { createFluxServiceAccount } from './service_account';

/**
 * Creates the FluxCD resources.
 *
 * @param {kubernetes.Provider} provider the Kubernetes provider
 */
export const createFluxResources = (provider: kubernetes.Provider) => {
  const serviceAccountKey = createFluxServiceAccount();
  deploySecrets(serviceAccountKey, provider);
};
