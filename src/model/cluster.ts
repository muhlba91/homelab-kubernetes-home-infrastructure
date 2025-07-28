import { Output } from '@pulumi/pulumi';

/**
 * Defines a cluster.
 */
export interface ClusterData {
  readonly kubeconfig: Output<string>;
  readonly talosconfig: Output<string>;
}
