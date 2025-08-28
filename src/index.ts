import { createCertManagerResources } from './lib/cert_manager';
import { createCloudNativePGResources } from './lib/cloudnative_pg';
import { environment } from './lib/configuration';
import { createExternalDNSResources } from './lib/external_dns';
import { createFluxResources } from './lib/flux';
import { createFrigateResources } from './lib/frigate';
import { createHomeAssistantResources } from './lib/home_assistant';
import { createInfluxDBResources } from './lib/influxdb';
import { retrieveProvider } from './lib/kubernetes/provider';
import { createCluster } from './lib/talos';
import { createDir } from './lib/util/create_dir';
import { createVeleroResources } from './lib/velero';

export = async () => {
  createDir(`outputs/${environment}`);

  // Kubernetes cloud resources
  createHomeAssistantResources();
  createInfluxDBResources();
  createExternalDNSResources();
  createCertManagerResources();
  createVeleroResources();
  createCloudNativePGResources();
  createFrigateResources();

  // Talos cluster resources
  const cluster = createCluster();
  const provider = retrieveProvider(cluster);

  // Flux
  createFluxResources(provider);

  return {};
};
