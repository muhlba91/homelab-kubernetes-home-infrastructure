import { createCertManagerResources } from './lib/cert_manager';
import { createCloudNativePGResources } from './lib/cloudnative_pg';
import { createExternalDNSResources } from './lib/external_dns';
import { createFluxResources } from './lib/flux';
import { createHomeAssistantResources } from './lib/home_assistant';
import { retrieveProvider } from './lib/kubernetes/provider';
import { createCluster } from './lib/talos';
import { createDir } from './lib/util/create_dir';
import { createVeleroResources } from './lib/velero';

export = async () => {
  createDir('outputs');

  // Kubernetes cloud resources
  createHomeAssistantResources();
  createExternalDNSResources();
  createCertManagerResources();
  createVeleroResources();
  createCloudNativePGResources();

  // Talos cluster resources
  const cluster = createCluster();
  const provider = retrieveProvider(cluster);

  // Flux
  createFluxResources(provider);

  return {};
};
