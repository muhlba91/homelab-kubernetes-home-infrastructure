/**
 * Defines a server.
 */
import { Output, Resource } from '@pulumi/pulumi';

export interface ServerData {
  readonly resource: Resource;
  readonly hostname: string;
  readonly serverId: Output<number | undefined>;
  readonly ipv4Address: string;
  readonly ipv6Address: string;
}
