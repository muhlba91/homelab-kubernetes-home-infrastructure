/**
 * Defines configuration data for k0s.
 */
export interface K0sConfig {
  readonly apiLoadBalancer: string;
  readonly cilium: K0sChartConfig;
}

/**
 * Defines configuration data for a chart on k0s.
 */
export interface K0sChartConfig {
  readonly enabled: boolean;
  readonly version: string;
}
