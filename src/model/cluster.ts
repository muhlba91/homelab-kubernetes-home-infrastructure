import { StringMap } from './map';
import { ServerData } from './server';

/**
 * Defines a cluster.
 */
export type ClusterData = {
  readonly name: string;
  readonly servers: StringMap<ServerData>;
  readonly rolesToNodes: StringMap<readonly string[]>;
  readonly nodeLabels: StringMap<string>;
};
