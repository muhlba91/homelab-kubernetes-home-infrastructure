import { Config, getStack } from '@pulumi/pulumi';

import { CiliumConfig } from '../model/config/cilium';
import { ClusterIntegrationConfig } from '../model/config/cluster_integration';
import { GatesConfig } from '../model/config/gates';
import { GoogleConfig } from '../model/config/google';
import { NetworkConfig } from '../model/config/network';
import { SecretStoresConfig } from '../model/config/secret_stores';
import { TalosConfig } from '../model/config/talos';

export const environment = getStack();

const config = new Config();
export const gatesConfig = config.requireObject<GatesConfig>('gates');
export const googleConfig = config.requireObject<GoogleConfig>('google');
export const talosConfig = config.requireObject<TalosConfig>('talos');
export const ciliumConfig = config.requireObject<CiliumConfig>('cilium');
export const clusterIntegrationConfig =
  config.getObject<ClusterIntegrationConfig>('clusterIntegration');
export const networkConfig = config.requireObject<NetworkConfig>('network');
export const secretStoresConfig =
  config.requireObject<SecretStoresConfig>('secretStores');
export const bucketId = config.require<string>('bucketId');
export const backupBucketId = config.require<string>('backupBucketId');

export const globalName = 'home';

export const gcpDefaultRegion = 'europe-west4';

export const commonLabels = {
  environment: environment,
  cluster: globalName,
};
