/**
 * Defines gates configuration.
 */
export interface GatesConfig {
  readonly homeAssistant: boolean;
  readonly externalDns: boolean;
  readonly certManager: boolean;
  readonly velero: boolean;
  readonly cloudNativePg: boolean;
  readonly cluster: boolean;
}
