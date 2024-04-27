import * as fs from 'fs';
import { setTimeout } from 'timers/promises';

import * as kubernetes from '@pulumi/kubernetes';
import { all } from '@pulumi/pulumi';
import { parse } from 'yaml';

import { createCertManagerResources } from './lib/cert_manager';
import { deployCilium } from './lib/cilium';
import { createCloudNativePGResources } from './lib/cloudnative_pg';
import { createClusterResources } from './lib/cluster';
import { createCluster } from './lib/cluster/k0sctl';
import {
  clusterConfig,
  environment,
  globalName,
  k0sConfig,
  ufwConfig,
  username,
} from './lib/configuration';
import { createExternalDNSResources } from './lib/external_dns';
import { createFluxResources } from './lib/flux';
import { createHomeAssistantResources } from './lib/home_assistant';
import { createDir } from './lib/util/create_dir';
import { readFileContents } from './lib/util/file';
import { createRandomPassword } from './lib/util/random';
import { sortedServerData } from './lib/util/sort';
import { createSSHKey } from './lib/util/ssh_key';
import { writeFilePulumiAndUploadToS3 } from './lib/util/storage';
import { renderTemplate } from './lib/util/template';
import { createVeleroResources } from './lib/velero';

export = async () => {
  createDir('outputs');

  // Servers
  const userPassword = createRandomPassword('server', {});
  const sshKey = createSSHKey('home', {});
  const clusterData = all([
    userPassword.password,
    sshKey.publicKeyOpenssh,
  ]).apply(([userPasswordPlain, sshPublicKey]) =>
    createClusterResources(
      clusterConfig,
      userPasswordPlain,
      sshPublicKey.trim(),
    ),
  );

  // Write output files for the cluster
  writeFilePulumiAndUploadToS3('ssh.key', sshKey.privateKeyPem, {
    permissions: '0600',
  });
  writeFilePulumiAndUploadToS3(
    'k0sctl.yml',
    all([
      clusterData.servers,
      clusterData.rolesToNodes,
      clusterData.nodeLabels,
    ]).apply(([servers, rolesToNodes, nodeLabels]) =>
      renderTemplate('assets/k0sctl/k0sctl.yml.j2', {
        environment: environment,
        clusterName: globalName,
        k0s: k0sConfig,
        username: username,
        clusterNodes: sortedServerData(Object.values(servers)),
        clusterRoles: rolesToNodes,
        nodeLabels: nodeLabels,
        featureGates: clusterConfig.featureGates,
      }),
    ),
    {},
  );
  writeFilePulumiAndUploadToS3(
    'inventory.yml',
    all([clusterData.servers]).apply(([servers]) =>
      renderTemplate('assets/ansible.yml.j2', {
        username: username,
        clusterNodes: Object.values(servers),
        ufw: ufwConfig,
      }),
    ),
    {},
  );

  // Kubernetes cloud resources
  createHomeAssistantResources();
  createExternalDNSResources();
  createCertManagerResources();
  createVeleroResources();
  createCloudNativePGResources();

  // k0sctl cluster creation
  // eslint-disable-next-line functional/no-loop-statements
  while (!fs.existsSync('./outputs/k0sctl.yml')) {
    await setTimeout(1000);
  }
  const k0sVersion = parse(readFileContents('./outputs/k0sctl.yml'))['spec'][
    'k0s'
  ]['version'];
  const kubeConfig = clusterData.servers.apply((servers) =>
    createCluster(k0sVersion, Object.values(servers), {}),
  );
  clusterData.servers.apply((servers) => {
    const kubernetesProvider = new kubernetes.Provider(
      `${globalName}-cluster`,
      {
        kubeconfig: kubeConfig,
      },
    );

    deployCilium({
      pulumiOptions: {
        dependsOn: Object.values(servers).map((server) => server.resource),
      },
    });

    createFluxResources(kubernetesProvider);
  });
  writeFilePulumiAndUploadToS3('admin.conf', kubeConfig, {});

  return {
    cluster: {
      configuration: {
        kubeconfig: kubeConfig,
      },
    },
  };
};
