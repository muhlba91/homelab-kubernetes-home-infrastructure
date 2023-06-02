/**
 * Defines configuration data for k0s.
 */
export type K0sConfig = {
  readonly version: string;
  readonly apiLoadBalancer: string;
  readonly cilium: K0sChartConfig;
  readonly argocdApps: K0sChartConfig;
};

/**
 * Defines configuration data for cilium on k0s.
 */
export type K0sChartConfig = {
  readonly version: string;
};
