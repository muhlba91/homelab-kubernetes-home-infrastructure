import { StringMap } from '../../map';

import { ClusterNodeConfig } from './node';

/**
 * Defines configuration data for the cluster.
 */
export type ClusterConfig = {
  readonly nodes: StringMap<ClusterNodeConfig>;
  readonly featureGates?: readonly string[];
};
