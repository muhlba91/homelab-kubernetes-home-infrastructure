/**
 * Defines configuration data for the server.
 */
export type ServerConfig = {
  readonly host: string;
  readonly ipv4Address: string;
  readonly ipv6Address: string;
  readonly cpu: number;
  readonly sockets?: number;
  readonly cpuType?: string;
  readonly memory: ServerMemoryConfig;
  readonly diskSize: number;
  readonly startupOrder: number;
};

/**
 * Defines memory configuration data for the server.
 */
export type ServerMemoryConfig = {
  readonly min: number;
  readonly max: number;
};
