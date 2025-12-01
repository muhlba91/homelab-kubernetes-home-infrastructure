/**
 * Defines gates configuration.
 */
export interface GatesConfig {
  readonly homeAssistant: boolean;
  readonly influxdb: boolean;
  readonly externalDns: boolean;
  readonly certManager: boolean;
  readonly flux: boolean;
  readonly nvidia: boolean;
  readonly coralTpu: boolean;
  readonly cluster: boolean;
}
