/**
 * Defines network configuration.
 */
export type NetworkConfig = {
  readonly nameservers: readonly string[];
  readonly domain: string;
  readonly ipv4: NetworkIPConfig;
  readonly ipv6: NetworkIPConfig;
};

/**
 * Defines IPv network configuration.
 */
export type NetworkIPConfig = {
  readonly enabled: boolean;
  readonly cidrMask: string;
  readonly gateway: string;
};
