import { Command } from '@pulumi/command/local';
import { all, Output } from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';
import * as yaml from 'yaml';

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

  return {
    resources: [installResource, ...upgradeResources],
    clientConfiguration: talosSecrets.clientConfiguration,
    kubeconfig: talosctlKubeConfig.kubeconfigRaw,
    talosconfig: talosconfigFile,
  };
};

/**
 * Writes the controlplane and machine secrets files.
 *
 * @param {Output<talos.types.output.machine.MachineSecrets>} machineSecrets the machine secrets
 * @returns {Output<unknown>} the output when the files are written
 */
const writeControlplaneAndSecretsFiles = (
  machineSecrets: Output<talos.types.output.machine.MachineSecrets>,
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
    'secrets.yaml',
    machineSecrets.apply((secrets) =>
      yaml.stringify(structuredClone(secrets)).replace(/cert:/g, 'crt:'),
    ),
    {},
  );

  return controlplane;
};

/**
 * Writes the talosconfig and kubeconfig file.
 *
 * @returns {Output<string[]>} the output containing the talosconfig and kubeconfig files
 */
const writeTalosConfigFiles = (): Output<string[]> => {
  const configFiles = new Command(
    'talos-config-files',
    {
      create: renderTemplate('assets/talos/talosconfig.sh.j2', {
        endpoint: talosConfig.machine.network.ip.v4,
      }),
      update: renderTemplate('assets/talos/talosconfig.sh.j2', {
        endpoint: talosConfig.machine.network.ip.v4,
      }),
      triggers: [Math.random()],
    },
    {
      additionalSecretOutputs: ['stdout'],
    },
  );

  const files = configFiles.stdout.apply((output) => {
    const files = output.split('---FILE---');
    writeFilePulumiAndUploadToS3(
      'talosconfig',
      Output.create(
        writeFileContents('./outputs/talosconfig', files[1].trim(), {}),
      ),
      {},
    );
    // writeFilePulumiAndUploadToS3(
    //   'admin.conf',
    //   Output.create(writeFileContents('./outputs/admin.conf', files[2].trim(), {})),
    //   {},
    // );

    return [files[1].trim(), files[2].trim()];
  });

  return files;
};
