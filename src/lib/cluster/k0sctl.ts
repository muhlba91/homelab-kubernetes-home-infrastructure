import * as fs from 'fs';

import { local } from '@pulumi/command';
import {
  CustomResourceOptions,
  Output,
  Resource,
  UnwrappedObject,
} from '@pulumi/pulumi';

import { ServerData } from '../../model/server';
import { k0sConfig } from '../configuration';

/**
 * Creates the cluster nodes.
 *
 * @param {UnwrappedObject<ServerData[]>} servers the servers
 * @param {CustomResourceOptions} pulumiOptions the pulumi options (optional)
 * @returns {Output<string>} the kubeconfig
 */
export const createCluster = (
  servers: UnwrappedObject<readonly ServerData[]>,
  {
    pulumiOptions,
  }: {
    readonly pulumiOptions?: CustomResourceOptions;
  },
): Output<string> => {
  const serverResources = servers.map((server) => server.resource);

  const k0sctl = new local.Command(
    'k0sctl',
    {
      create: './assets/k0sctl/apply.sh',
      update: './assets/k0sctl/apply.sh',
      triggers: [
        k0sConfig.version,
        k0sConfig.apiLoadBalancer,
        ...serverResources,
      ],
      environment: {
        SSH_KNOWN_HOSTS: '/dev/null',
      },
    },
    {
      ...pulumiOptions,
      customTimeouts: {
        create: '40m',
        update: '40m',
      },
      dependsOn: (
        (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
      ).concat(serverResources),
    },
  );

  // TODO: we always need to trigger this to generate our kubeconfig
  const k0sctlKubeConfig = new local.Command(
    'k0sctl-kubeconfig',
    {
      create: './assets/k0sctl/kubeconfig.sh',
      update: './assets/k0sctl/kubeconfig.sh',
      triggers: [Output.create(Math.random())],
      environment: {
        SSH_KNOWN_HOSTS: '/dev/null',
      },
    },
    {
      ...pulumiOptions,
      customTimeouts: {
        create: '40m',
        update: '40m',
      },
      dependsOn: (
        (pulumiOptions?.dependsOn ?? []) as readonly Resource[]
      ).concat(k0sctl),
    },
  );

  return k0sctlKubeConfig.assets.apply(() =>
    fs.readFileSync('outputs/admin.conf', 'utf-8'),
  );
};
