import { StringMap } from './map';
import { ServerData } from './server';

/**
 * Defines a cluster.
 */
export interface ClusterData {
  readonly servers: StringMap<ServerData>;
  readonly rolesToNodes: StringMap<readonly string[]>;
  readonly nodeLabels: StringMap<string>;
}
