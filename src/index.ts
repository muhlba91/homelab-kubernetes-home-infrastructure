import * as kubernetes from '@pulumi/kubernetes';
import { all } from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';

import { createCertManagerResources } from './lib/cert_manager';
import { deployCilium } from './lib/cilium';
import { createCloudNativePGResources } from './lib/cloudnative_pg';
import { globalName, talosConfig } from './lib/configuration';
import { createExternalDNSResources } from './lib/external_dns';
import { createFluxResources } from './lib/flux';
import { createHomeAssistantResources } from './lib/home_assistant';
import { createCluster } from './lib/talos';
import { createDir } from './lib/util/create_dir';
import { writeFilePulumiAndUploadToS3 } from './lib/util/storage';
import { createVeleroResources } from './lib/velero';

export = async () => {
  createDir('outputs');

  // Kubernetes cloud resources
  createHomeAssistantResources();
  createExternalDNSResources();
  createCertManagerResources();
  createVeleroResources();
  createCloudNativePGResources();

  const cluster = createCluster();
  const k8sAdminConf = writeFilePulumiAndUploadToS3(
    'admin.conf',
    cluster.kubeconfig,
    {},
  );
  const postInstall = all([k8sAdminConf, cluster.kubeconfig])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .apply(([_, k8sConfig]) => {
      const kubernetesProvider = new kubernetes.Provider(
        `${globalName}-cluster`,
        {
          kubeconfig: k8sConfig,
        },
      );

      const cilium = deployCilium({
        pulumiOptions: {
          dependsOn: cluster.resources.map((resource) => resource),
        },
      });

      createFluxResources(kubernetesProvider);

      return cilium;
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postInstall.apply((_) =>
    talos.cluster.getHealthOutput({
      clientConfiguration: cluster.clientConfiguration,
      controlPlaneNodes: [talosConfig.machine.network.ip.v4],
      endpoints: [talosConfig.machine.network.ip.v4],
    }),
  );

  return {
    cluster: {
      kubeconfig: cluster.kubeconfig,
      talosconfig: cluster.talosconfig,
    },
  };
};
