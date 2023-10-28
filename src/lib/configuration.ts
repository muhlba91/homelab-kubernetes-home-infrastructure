import { Config, getStack } from '@pulumi/pulumi';

import { ClusterConfig } from '../model/config/cluster/cluster';
import { GCPConfig } from '../model/config/gcp';
import { HomeAssistantConfig } from '../model/config/home_assistant';
import { K0sConfig } from '../model/config/k0s';
import { NetworkConfig } from '../model/config/network';
import { ProxmoxConfig } from '../model/config/proxmox';
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
export const username = config.require<string>('username');
export const bucketId = config.require<string>('bucketId');

export const commonLabels = {
  environment: environment,
  cluster: clusterConfig.name,
};
