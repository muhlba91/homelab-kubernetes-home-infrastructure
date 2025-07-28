import * as kubernetes from '@pulumi/kubernetes';
import { Output } from '@pulumi/pulumi';

import { gatesConfig } from '../configuration';

import { deploySecrets } from './secrets';
import { createFluxServiceAccount } from './service_account';

/**
 * Creates the FluxCD resources.
 *
 * @param {Output<kubernetes.Provider>} provider the Kubernetes provider
 */
export const createFluxResources = (provider?: Output<kubernetes.Provider>) => {
  if (gatesConfig.flux && provider) {
    const serviceAccountKey = createFluxServiceAccount();
    provider.apply((k8sProvider) => {
      deploySecrets(serviceAccountKey, k8sProvider);
    });
  }
};
