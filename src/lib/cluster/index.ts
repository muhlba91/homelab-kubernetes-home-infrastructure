import { ClusterData } from '../../model/cluster';
import { ClusterConfig } from '../../model/config/cluster/cluster';
import { StringMap } from '../../model/map';

import { _createServers } from './servers';

/**
 * Creates the cluster nodes.
 *
 * @param {ClusterConfig} clusterConfig the cluster configuration
 * @param {string} userPassword the user's password
 * @param {string} sshPublicKey the SSH public key (OpenSSH)
 * @returns {ClusterData} the cluster
 */
export const createClusterResources = (
  clusterConfig: ClusterConfig,
  userPassword: string,
  sshPublicKey: string
): ClusterData => {
  const servers = _createServers(clusterConfig, userPassword, sshPublicKey);

  return {
    name: clusterConfig.name,
    servers: servers,
    rolesToNodes: _createRolesToNodes(clusterConfig),
    nodeLabels: _createNodeLabels(clusterConfig),
  };
};

/**
 * Creates the roles to nodes mapping.
 *
 * @param {ClusterConfig} clusterConfig the cluster configuration
 * @returns {StringMap<readonly string[]>} the mapping
 */
const _createRolesToNodes = (
  clusterConfig: ClusterConfig
): StringMap<readonly string[]> =>
  Object.fromEntries(
    Object.entries(clusterConfig.nodes).map(([name, node]) => [
      name,
      node.roles,
    ])
  );

/**
 * Creates the labels to nodes mapping.
 *
 * @param {ClusterConfig} clusterConfig the cluster configuration
 * @returns {StringMap<string>} the mapping
 */
const _createNodeLabels = (clusterConfig: ClusterConfig): StringMap<string> =>
  Object.fromEntries(
    Object.entries(clusterConfig.nodes).map(([name, node]) => [
      name,
      (node.labels
        ? Object.entries(node.labels)
            .map(([key, value]) => `${key}=${value}`)
            .join(',') + ','
        : '') + `hostname=${name}`,
    ])
  );
