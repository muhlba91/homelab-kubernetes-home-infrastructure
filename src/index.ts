import { createBuckets } from './lib/buckets';
import { createCertManagerResources } from './lib/cert_manager';
import { environment } from './lib/configuration';
import { createExternalDNSResources } from './lib/external_dns';
import { createFluxResources } from './lib/flux';
import { createHomeAssistantResources } from './lib/home_assistant';
import { createInfluxDBResources } from './lib/influxdb';
import { retrieveProvider } from './lib/kubernetes/provider';
import { createPasswords } from './lib/passwords';
import { createCluster } from './lib/talos';
import { createDir } from './lib/util/create_dir';

export = async () => {
  createDir(`outputs/${environment}`);

  // Kubernetes cloud resources
  const iam = createBuckets();
  createPasswords();
  createHomeAssistantResources(iam['home-assistant']);
  createInfluxDBResources();
  createExternalDNSResources();
  createCertManagerResources();

  // Talos cluster resources
  const cluster = createCluster();
  const provider = retrieveProvider(cluster);

  // Flux
  createFluxResources(provider);

  return {};
};
