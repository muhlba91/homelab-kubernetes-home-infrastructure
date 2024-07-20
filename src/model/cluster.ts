import { Output, Resource } from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';

/**
 * Defines a cluster.
 */
export interface ClusterData {
  readonly resources: readonly Resource[];
  readonly clientConfiguration: Output<talos.types.output.machine.SecretsClientConfiguration>;
  readonly kubeconfig: Output<string>;
  readonly talosconfig: Output<string>;
}
