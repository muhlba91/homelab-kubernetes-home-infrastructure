import * as kubernetes from '@pulumi/kubernetes';
import { Output } from '@pulumi/pulumi';

import { ClusterData } from '../../model/cluster';
import { clusterIntegrationConfig, globalName } from '../configuration';

/**
 * Retrieves the Kubernetes provider.
 *
 * @param {ClusterData | undefined} cluster the cluster data
 * @returns {Output<kubernetes.Provider> | undefined} the Kubernetes provider
 */
export const retrieveProvider = (
  cluster: ClusterData | undefined,
): Output<kubernetes.Provider> | undefined => {
  if (cluster?.provider) {
    return cluster.provider;
  }

  if (clusterIntegrationConfig?.kubeconfig) {
    return Output.create(
      new kubernetes.Provider(`${globalName}-cluster-integration`, {
        kubeconfig: clusterIntegrationConfig.kubeconfig,
      }),
    );
  }

  return undefined;
};
