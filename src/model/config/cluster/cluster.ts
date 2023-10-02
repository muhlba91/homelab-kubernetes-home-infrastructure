import { StringMap } from '../../map';

import { ClusterNodeConfig } from './node_data';

/**
 * Defines configuration data for the cluster.
 */
export type ClusterConfig = {
  readonly name: string;
  readonly nodes: StringMap<ClusterNodeConfig>;
  readonly featureGates?: readonly string[];
};
