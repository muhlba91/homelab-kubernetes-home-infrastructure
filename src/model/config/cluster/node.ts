/**
 * Defines configuration data for the cluster node.
 */
import { StringMap } from '../../map';
import { ServerConfig } from '../server';

export type ClusterNodeConfig = ServerConfig & {
  readonly roles: readonly string[];
  readonly labels?: readonly StringMap<string>[];
};
