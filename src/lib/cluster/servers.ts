import { ClusterConfig } from '../../model/config/cluster/cluster';
import { StringMap } from '../../model/map';
import { ServerData } from '../../model/server';
import { globalName } from '../configuration';
import { createServer } from '../proxmox/create';

/**
 * Creates the servers.
 *
 * @param {ClusterConfig} clusterConfig the cluster configuration
 * @param {string} userPassword the user's password
 * @param {string} sshPublicKey the SSH public key (OpenSSH)
 * @returns {StringMap<ServerData>} the servers
 */
export const createServers = (
  clusterConfig: ClusterConfig,
  userPassword: string,
  sshPublicKey: string,
): StringMap<ServerData> =>
  Object.fromEntries(
    Object.entries(clusterConfig.nodes).map(([name, config]) => [
      name,
      createServer(globalName, name, userPassword, sshPublicKey, config),
    ]),
  );
