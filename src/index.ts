import { createCertManagerResources } from './lib/cert_manager';
import { createCloudNativePGResources } from './lib/cloudnative_pg';
import { createExternalDNSResources } from './lib/external_dns';
import { createHomeAssistantResources } from './lib/home_assistant';
import { createCluster } from './lib/talos';
import { createDir } from './lib/util/create_dir';
import { createVeleroResources } from './lib/velero';

export = async () => {
  createDir('outputs');
  const returnValue = {
    cluster: undefined as object | undefined,
  };

  // Kubernetes cloud resources
  createHomeAssistantResources();
  createExternalDNSResources();
  createCertManagerResources();
  createVeleroResources();
  createCloudNativePGResources();

  // Talos cluster resources
  // eslint-disable-next-line functional/immutable-data
  returnValue.cluster = createCluster();

  return returnValue;
};
