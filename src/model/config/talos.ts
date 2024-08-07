/**
 * Defines configuration data for Talos.
 */
export interface TalosConfig {
  readonly machine: TalosMachineConfig;
  readonly cluster: TalosClusterConfig;
}

/**
 * Defines configuration data for a machine in Talos.
 */
export interface TalosMachineConfig {
  readonly hostname: string;
  readonly disk: string;
  readonly network: TalosMachineNetworkConfig;
}

/**
 * Defines configuration data for a cluster in Talos.
 */
export interface TalosClusterConfig {
  readonly installImageHash: string;
  readonly vip: string;
  readonly revision: string;
}

/**
 * Defines configuration data for a network for a machine on Talos.
 */
export interface TalosMachineNetworkConfig {
  readonly ip: TalosIPAddressConfig;
  readonly mac: string;
}

/**
 * Defines configuration data for IP addresses on Talos.
 */
export interface TalosIPAddressConfig {
  readonly v4: string;
  readonly v6: string;
}
