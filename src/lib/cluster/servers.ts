import { ClusterConfig } from '../../model/config/cluster/cluster';
import { StringMap } from '../../model/map';
import { ServerData } from '../../model/server';
import { createServer } from '../server/create';

/**
 * Creates the servers.
 *
 * @param {ClusterConfig} clusterConfig the cluster configuration
 * @param {string} userPassword the user's password
 * @param {string} sshPublicKey the SSH public key (OpenSSH)
 * @returns {StringMap<ServerData>} the servers
 */
export const _createServers = (
  clusterConfig: ClusterConfig,
  userPassword: string,
  sshPublicKey: string
): StringMap<ServerData> => {
  // eslint-disable-next-line functional/no-let
  let servers = <StringMap<ServerData>>{};
  // eslint-disable-next-line functional/no-loop-statements
  for (const nodeName in clusterConfig.nodes) {
    const node = clusterConfig.nodes[nodeName];
    const server = createServer(
      clusterConfig.name,
      nodeName,
      userPassword,
      sshPublicKey,
      node
    );
    servers = {
      [nodeName]: server,
      ...servers,
    };
  }
  return servers;
};
