import { all, Output } from '@pulumi/pulumi';
import { hashSync } from 'bcryptjs';

import { deployArgoCDResources } from './lib/argocd';
import { createCertManagerResources } from './lib/cert_manager';
import { deployCilium } from './lib/cilium';
import { createClusterResources } from './lib/cluster';
import { createCluster } from './lib/cluster/k0sctl';
import {
  argocdConfig,
  bucketId,
  clusterConfig,
  environment,
  gcpConfig,
  k0sConfig,
  ufwConfig,
  username,
} from './lib/configuration';
import { createExternalDNSResources } from './lib/external_dns';
import { uploadToS3 } from './lib/gcp/storage/upload';
import { createHomeAssistantResources } from './lib/home_assistant';
import { createKSopsResources } from './lib/ksops';
import { createDir } from './lib/util/create_dir';
import { writeFilePulumi } from './lib/util/file';
import { createRandomPassword } from './lib/util/random';
import { sortedServerData } from './lib/util/sort';
import { createSSHKey } from './lib/util/ssh_key';
import { renderTemplate } from './lib/util/template';

export = async () => {
  createDir('outputs');

  // Server access
  const userPassword = createRandomPassword('server', {});
  const sshKey = createSSHKey('home', {});

  // Cluster base service resources
  const argocdPassword = createRandomPassword('argocd-admin', {});

  // Cluster servers
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

  // Write cluster output files
  writeFilePulumiAndUploadToS3('ssh.key', sshKey.privateKeyPem, {
    permissions: '0600',
  });
  writeFilePulumiAndUploadToS3(
    'k0sctl.yml',
    all([
      clusterData.servers,
      clusterData.rolesToNodes,
      clusterData.nodeLabels,
      argocdPassword,
    ]).apply(([servers, rolesToNodes, nodeLabels, argocdAdminPassword]) =>
      renderTemplate('assets/k0sctl/k0sctl.yml.j2', {
        environment: environment,
        clusterName: clusterConfig.name,
        k0s: k0sConfig,
        username: username,
        clusterNodes: sortedServerData(Object.values(servers)),
        clusterRoles: rolesToNodes,
        nodeLabels: nodeLabels,
        featureGates: clusterConfig.featureGates,
        argocd: argocdConfig,
        argocdAdminPassword: hashSync(argocdAdminPassword.password, 10),
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
  const ksopsKey = await createKSopsResources(gcpConfig.project, {});
  await createHomeAssistantResources(gcpConfig.project, {});
  await createExternalDNSResources(gcpConfig.project, {});
  await createCertManagerResources(gcpConfig.project, {});

  // k0sctl cluster creation
  const kubeConfig = all([clusterData.servers]).apply(([servers]) =>
    createCluster(Object.values(servers), {}),
  );
  all([clusterData.servers, kubeConfig, ksopsKey, argocdPassword]).apply(
    async ([servers, k8sConfig, credentials, argocdAdminPassword]) => {
      deployCilium({
        pulumiOptions: {
          dependsOn: Object.values(servers).map((server) => server.resource),
        },
      });
      await deployArgoCDResources(
        k8sConfig,
        credentials,
        argocdAdminPassword.password,
        {
          pulumiOptions: {
            dependsOn: Object.values(servers).map((server) => server.resource),
          },
        },
      );
    },
  );
  writeFilePulumiAndUploadToS3('admin.conf', kubeConfig, {});

  return {};
};

/**
 * Writes the pulumi Output to a file and uploads it to S3.
 *
 * @param {string} name the name of the file
 * @param {Output<string>} content the content
 * @param {string} permissions the permissions (default: 0644)
 * @returns {Output<unknown>} to track state
 */
const writeFilePulumiAndUploadToS3 = (
  name: string,
  content: Output<string>,
  { permissions = '0644' }: { readonly permissions?: string },
): Output<unknown> => {
  const path = 'outputs/' + name;
  return writeFilePulumi(path, content, {
    permissions: permissions,
  }).apply(() => {
    uploadToS3(
      bucketId,
      'cluster/' + clusterConfig.name + '/' + environment + '/' + name,
      path,
      {},
    );
  });
};
