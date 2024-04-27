import { Config, getStack } from '@pulumi/pulumi';

import { ClusterConfig } from '../model/config/cluster/cluster';
import { GCPConfig } from '../model/config/google';
import { HomeAssistantConfig } from '../model/config/home_assistant';
import { K0sConfig } from '../model/config/k0s';
import { NetworkConfig } from '../model/config/network';
import { ProxmoxConfig } from '../model/config/proxmox';
import { SecretStoresConfig } from '../model/config/secret_stores';
import { UFWConfig } from '../model/config/ufw';

export const environment = getStack();

const config = new Config();
export const pveConfig = config.requireObject<ProxmoxConfig>('pve');
export const gcpConfig = config.requireObject<GCPConfig>('gcp');
export const clusterConfig = config.requireObject<ClusterConfig>('cluster');
export const k0sConfig = config.requireObject<K0sConfig>('k0s');
export const networkConfig = config.requireObject<NetworkConfig>('network');
export const ufwConfig = config.requireObject<UFWConfig>('ufw');
export const homeAssistantConfig =
  config.requireObject<HomeAssistantConfig>('homeAssistant');
export const secretStoresConfig =
  config.requireObject<SecretStoresConfig>('secretStores');
export const username = config.require<string>('username');
export const bucketId = config.require<string>('bucketId');
export const backupBucketId = config.require<string>('backupBucketId');

export const globalName = 'home';

export const gcpDefaultRegion = 'europe-west4';

export const commonLabels = {
  environment: environment,
  cluster: globalName,
};
