import { all } from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';

import { ClusterData } from '../../model/cluster';
import { gatesConfig, talosConfig } from '../configuration';

import {
  writeControlplaneAndSecretsFiles,
  writeTalosConfigFiles,
} from './files';
import { installCluster } from './install';
import { postInstall } from './post_install';
import { upgradeCluster } from './upgrade';

/**
 * Create the cluster.
 *
 * @returns {ClusterData} the cluster data
 */
export const createCluster = (): ClusterData | undefined => {
  if (!gatesConfig.cluster) {
    return undefined;
  }

  const talosSecrets = new talos.machine.Secrets(
    `talos-secrets-${talosConfig.cluster.revision}`,
    {},
  );
  const controlplane = writeControlplaneAndSecretsFiles(
    talosSecrets.machineSecrets,
  );

  // Talos config files
  const configFiles = writeTalosConfigFiles();
  const talosconfigFile = configFiles[0];

  // install Talos & Kubernetes
  const installResource = installCluster();

  // upgrade Talos & Kubernetes
  const upgradeResources = upgradeCluster(controlplane, installResource);

  // get kubeconfig
  const talosctlKubeConfig = all([
    ...upgradeResources.map((resource) => resource.stdout),
    installResource.stdout,
  ]).apply(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_) =>
      new talos.cluster.Kubeconfig(
        'talos-kubeconfig',
        {
          clientConfiguration: talosSecrets.clientConfiguration,
          node: talosConfig.machine.network.ip.v4,
        },
        {},
      ),
  );

  // post-installation tasks
  postInstall(
    talosctlKubeConfig.kubeconfigRaw,
    talosSecrets.clientConfiguration,
    [installResource, ...upgradeResources],
  );

  return {
    kubeconfig: talosctlKubeConfig.kubeconfigRaw,
    talosconfig: talosconfigFile,
  };
};
