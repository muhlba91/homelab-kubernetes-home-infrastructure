import { local } from '@pulumi/command';

import { talosConfig } from '../configuration';

/**
 * Installs the cluster.
 *
 * @returns {local.Command} the resource
 */
export const installCluster = (): local.Command => {
  // validate Talos config
  const talosctlValidate = new local.Command('talosctl-validate', {
    create: './assets/talos/validate.sh',
    update: './assets/talos/validate.sh',
  });

  // install Talos
  return new local.Command(
    'talosctl-apply',
    {
      create: './assets/talos/apply.sh',
      environment: {
        CONTROL_PLANE_IP: talosConfig.machine.network.ip.v4,
      },
    },
    {
      customTimeouts: {
        create: '40m',
      },
      dependsOn: [talosctlValidate],
    },
  );
};
