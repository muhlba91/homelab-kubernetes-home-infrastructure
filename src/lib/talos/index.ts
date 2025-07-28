import * as kubernetes from '@pulumi/kubernetes';
import { all } from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';

import { ClusterData } from '../../model/cluster';
import { deployCilium } from '../cilium';
import { gatesConfig, globalName, talosConfig } from '../configuration';
import { writeFilePulumiAndUploadToS3 } from '../util/storage';

import {
  writeControlplaneAndSecretsFiles,
  writeTalosConfigFiles,
} from './files';
import { installCluster } from './install';
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

  // Talos related secrets
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
  const kubeconfigFile = writeFilePulumiAndUploadToS3(
    'admin.conf',
    talosctlKubeConfig.kubeconfigRaw,
    {},
  );
  const kubernetesProvider = talosctlKubeConfig.kubeconfigRaw.apply(
    (kubeconfig) =>
      new kubernetes.Provider(
        `${globalName}-cluster`,
        {
          kubeconfig: kubeconfig,
        },
        {
          dependsOn: [kubeconfigFile],
        },
      ),
  );

  // cilium
  const cilium = deployCilium({
    pulumiOptions: {
      dependsOn: [installResource, kubeconfigFile, ...upgradeResources],
    },
  });

  // health check
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cilium.stdout.apply((_) =>
    talos.cluster.getHealthOutput({
      clientConfiguration: talosSecrets.clientConfiguration,
      controlPlaneNodes: [talosConfig.machine.network.ip.v4],
      endpoints: [talosConfig.machine.network.ip.v4],
    }),
  );

  return {
    kubeconfig: talosctlKubeConfig.kubeconfigRaw,
    talosconfig: talosconfigFile,
    provider: kubernetesProvider,
  };
};
