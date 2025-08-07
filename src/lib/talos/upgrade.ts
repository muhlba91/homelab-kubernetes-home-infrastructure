import { local } from '@pulumi/command';
import { Output } from '@pulumi/pulumi';
import { parse } from 'yaml';

import { environment, talosConfig } from '../configuration';
import { readFileContents } from '../util/file';

/**
 * Upgrades the cluster.
 *
 * @param {Output<unknown>} controlplane the controlplane output
 * @param {local.Command} installResource the Talosctl command resource
 * @returns {local.Command[]} the resources
 */
export const upgradeCluster = (
  controlplane: Output<unknown>,
  installResource: local.Command,
): local.Command[] => {
  // extract Talos versions
  const talosVersion = controlplane.apply(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_) =>
      parse(readFileContents(`./outputs/${environment}/controlplane.yml`))[
        'machine'
      ]['install']['image'].split(':')[1],
  );
  const kubernetesVersion = controlplane.apply(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_) =>
      parse(readFileContents(`./outputs/${environment}/controlplane.yml`))[
        'cluster'
      ]['apiServer']['image'].split(':')[1],
  );

  // upgrade Talos
  const talosctlUpgrade = new local.Command(
    'talosctl-upgrade',
    {
      create: './assets/talos/noop.sh',
      update: './assets/talos/upgrade_talos.sh',
      environment: {
        ENVIRONMENT: environment,
        CONTROL_PLANE_IP: talosConfig.machine.network.ip.v4,
        INSTALL_IMAGE_HASH: talosConfig.cluster.installImageHash,
        TALOS_VERSION: talosVersion,
      },
      triggers: [talosVersion],
    },
    {
      customTimeouts: {
        create: '40m',
      },
      dependsOn: [installResource],
    },
  );

  // upgrade Kubernetes
  const talosctlUpgradeK8s = new local.Command(
    'talosctl-upgrade-k8s',
    {
      create: './assets/talos/noop.sh',
      update: './assets/talos/upgrade_k8s.sh',
      environment: {
        ENVIRONMENT: environment,
        CONTROL_PLANE_IP: talosConfig.machine.network.ip.v4,
        KUBERNETES_VERSION: kubernetesVersion,
      },
      triggers: [kubernetesVersion],
    },
    {
      customTimeouts: {
        create: '40m',
      },
      dependsOn: [installResource, talosctlUpgrade],
    },
  );

  return [talosctlUpgrade, talosctlUpgradeK8s];
};
