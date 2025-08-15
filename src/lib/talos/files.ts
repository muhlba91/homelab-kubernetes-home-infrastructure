import * as fs from 'fs';

import { Command } from '@pulumi/command/local';
import { Output } from '@pulumi/pulumi';
import * as talos from '@pulumiverse/talos';
import * as yaml from 'yaml';

import {
  environment,
  gatesConfig,
  globalName,
  networkConfig,
  talosConfig,
} from '../configuration';
import { writeFileContents } from '../util/file';
import { writeFilePulumiAndUploadToS3 } from '../util/storage';
import { renderTemplate } from '../util/template';

/**
 * Writes the controlplane and machine secrets files.
 *
 * @param {Output<talos.types.output.machine.MachineSecrets>} machineSecrets the machine secrets
 * @returns {Output<unknown>} the output when the files are written
 */
export const writeControlplaneAndSecretsFiles = (
  machineSecrets: Output<talos.types.output.machine.MachineSecrets>,
): Output<unknown> => {
  const controlplane = writeFilePulumiAndUploadToS3(
    'controlplane.yml',
    machineSecrets.apply((secrets) =>
      renderTemplate('assets/talos/controlplane.yml.j2', {
        clusterName: globalName,
        network: networkConfig,
        talos: talosConfig,
        secrets: secrets,
        gates: gatesConfig,
      }),
    ),
    {},
  );

  writeFilePulumiAndUploadToS3(
    'secrets.yaml',
    machineSecrets.apply((secrets) =>
      yaml.stringify(structuredClone(secrets)).replace(/cert:/g, 'crt:'),
    ),
    {},
  );

  return controlplane;
};

/**
 * Writes the talosconfig and kubeconfig file.
 *
 * @returns {Output<string[]>} the output containing the talosconfig and kubeconfig files
 */
export const writeTalosConfigFiles = (): Output<string[]> => {
  const configFiles = new Command(
    'talos-config-files',
    {
      create: renderTemplate('assets/talos/talosconfig.sh.j2', {
        environment: environment,
        endpoint: talosConfig.machine.network.ip.v4,
      }),
      update: renderTemplate('assets/talos/talosconfig.sh.j2', {
        environment: environment,
        endpoint: talosConfig.machine.network.ip.v4,
      }),
      triggers: [Math.random()],
    },
    {
      additionalSecretOutputs: ['stdout'],
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const files = configFiles.stdout.apply((_) => {
    const talosconfig = fs.readFileSync(
      `./outputs/${environment}/talosconfig.tmp`,
      'utf-8',
    );
    writeFilePulumiAndUploadToS3(
      'talosconfig',
      Output.create(
        writeFileContents(
          `./outputs/${environment}/talosconfig`,
          talosconfig,
          {},
        ),
      ),
      {},
    );

    return [talosconfig];
  });

  return files;
};
