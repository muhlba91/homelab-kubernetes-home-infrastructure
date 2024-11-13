import { all, Output } from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';

import { ClusterData } from '../../model/cluster';
import { globalName, networkConfig, talosConfig } from '../configuration';
import { writeFileContents } from '../util/file';
import { writeFilePulumiAndUploadToS3 } from '../util/storage';
import { renderTemplate } from '../util/template';

import { installCluster } from './install';
import { upgradeCluster } from './upgrade';

/**
 * Create the cluster.
 *
 * @returns {ClusterData} the cluster data
 */
export const createCluster = (): ClusterData => {
  const talosSecrets = new talos.machine.Secrets(
    `talos-secrets-${talosConfig.cluster.revision}`,
    {},
  );
  const talosClientConfig = talos.client.getConfigurationOutput({
    clusterName: `${globalName}-cluster`,
    clientConfiguration: talosSecrets.clientConfiguration,
    nodes: [talosConfig.machine.network.ip.v4],
    endpoints: [talosConfig.machine.network.ip.v4],
  });

  // write output files for the cluster
  const controlplane = writeConfigFiles(
    talosSecrets.machineSecrets,
    talosClientConfig.talosConfig,
  );

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

  return {
    resources: [installResource, ...upgradeResources],
    clientConfiguration: talosSecrets.clientConfiguration,
    kubeconfig: talosctlKubeConfig.kubeconfigRaw,
    talosconfig: talosClientConfig.talosConfig,
  };
};

/**
 * Writes the config files.
 *
 * @param {Output<talos.types.output.machine.MachineSecrets>} machineSecrets the machine secrets
 * @param {Output<string>} talosClientConfig the Talos client config
 * @returns {Output<unknown>} the output when the files are written
 */
const writeConfigFiles = (
  machineSecrets: Output<talos.types.output.machine.MachineSecrets>,
  talosClientConfig: Output<string>,
): Output<unknown> => {
  const controlplane = writeFilePulumiAndUploadToS3(
    'controlplane.yml',
    machineSecrets.apply((secrets) =>
      renderTemplate('assets/talos/controlplane.yml.j2', {
        clusterName: globalName,
        network: networkConfig,
        talos: talosConfig,
        secrets: secrets,
      }),
    ),
    {},
  );
  writeFilePulumiAndUploadToS3(
    'talosconfig',
    talosClientConfig.apply((config) =>
      writeFileContents('./outputs/talosconfig', config, {}),
    ),
    {},
  );

  return controlplane;
};
