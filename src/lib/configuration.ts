import { Config, getStack } from '@pulumi/pulumi';

import { GatesConfig } from '../model/config/gates';
import { GoogleConfig } from '../model/config/google';
import { NetworkConfig } from '../model/config/network';
import { SecretStoresConfig } from '../model/config/secret_stores';
import { TalosConfig } from '../model/config/talos';

export const environment = getStack();
export const fixedStackName = 'prod'; // TODO: replace all occurrences of this with a dynamic value based on the environment

const config = new Config();
export const gatesConfig = config.requireObject<GatesConfig>('gates');
export const googleConfig = config.requireObject<GoogleConfig>('google');
export const talosConfig = config.requireObject<TalosConfig>('talos');
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
