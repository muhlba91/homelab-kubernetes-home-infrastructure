import { StringMap } from '../map';

/**
 * Defines configuration data for Proxmox VE.
 */
export type ProxmoxConfig = {
  readonly imageName: string;
  readonly storagePool: StringMap<string>;
  readonly localStoragePool: string;
  readonly networkBridge: string;
  readonly cpuType: string;
};
