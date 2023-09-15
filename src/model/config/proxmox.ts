/**
 * Defines configuration data for Proxmox VE.
 */
export type ProxmoxConfig = {
  readonly imageName: string;
  readonly storagePool: string;
  readonly localStoragePool: string;
  readonly networkBridge: string;
  readonly cpuType: string;
};
