/**
 * Defines configuration data for the server.
 */
export interface ServerConfig {
  readonly host: string;
  readonly ipv4Address: string;
  readonly ipv6Address: string;
  readonly cpu: number;
  readonly sockets?: number;
  readonly cpuType?: string;
  readonly memory: ServerMemoryConfig;
  readonly diskSize: number;
  readonly startupOrder: number;
  readonly usbPassthrough?: readonly ServerUsbPassthroughConfig[];
}

/**
 * Defines memory configuration data for the server.
 */
export interface ServerMemoryConfig {
  readonly min: number;
  readonly max: number;
}

/**
 * Defines USB passthrough configuration data for the server.
 */
export interface ServerUsbPassthroughConfig {
  readonly host: string;
  readonly usb3?: boolean;
}
