import { Output } from '@pulumi/pulumi';
import { RandomPassword } from '@pulumi/random';

/**
 * Defines a random password.
 */
export type RandomPasswordData = {
  readonly resource: RandomPassword;
  readonly password: Output<string>;
};
