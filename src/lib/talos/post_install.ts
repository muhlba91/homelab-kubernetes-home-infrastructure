import * as kubernetes from '@pulumi/kubernetes';
import { all, Output, Resource } from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';

import { deployCilium } from '../cilium';
import { globalName, talosConfig } from '../configuration';
import { createFluxResources } from '../flux';
import { writeFilePulumiAndUploadToS3 } from '../util/storage';

/**
 * Executes the post-installation tasks for the Talos cluster.
 */
export const postInstall = (
  kubeconfig: Output<string>,
  clientConfiguration: Output<talos.types.output.machine.ClientConfiguration>,
  resources: readonly Resource[],
) => {
  const k8sAdminConf = writeFilePulumiAndUploadToS3(
    'admin.conf',
    kubeconfig,
    {},
  );
  const postInstall = all([k8sAdminConf, kubeconfig])
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
          dependsOn: resources.map((resource) => resource),
        },
      });

      createFluxResources(kubernetesProvider);

      return cilium;
    });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postInstall.apply((_) =>
    talos.cluster.getHealthOutput({
      clientConfiguration: clientConfiguration,
      controlPlaneNodes: [talosConfig.machine.network.ip.v4],
      endpoints: [talosConfig.machine.network.ip.v4],
    }),
  );
};
