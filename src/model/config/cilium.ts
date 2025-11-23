/**
 * Defines configuration data for Cilium.
 */
export interface CiliumConfig {
  readonly podSubnets: CiliumIPAddressConfig;
}

/**
 * Defines configuration data for IP addresses on Cilium.
 */
export interface CiliumIPAddressConfig {
  readonly v4: string;
  readonly v6: string;
}
