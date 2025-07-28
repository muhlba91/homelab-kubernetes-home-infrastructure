import * as kubernetes from '@pulumi/kubernetes';
import { Output } from '@pulumi/pulumi';

/**
 * Defines a cluster.
 */
export interface ClusterData {
  readonly kubeconfig: Output<string>;
  readonly talosconfig?: Output<string>;
  readonly provider: Output<kubernetes.Provider>;
}
