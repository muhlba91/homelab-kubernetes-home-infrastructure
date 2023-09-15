import * as proxmox from '@muhlba91/pulumi-proxmoxve';

import { ServerConfig } from '../../model/config/server';
import { ServerData } from '../../model/server';
import {
  clusterConfig,
  environment,
  networkConfig,
  pveConfig,
  username,
} from '../configuration';
import { readFileContents } from '../util/file';

// FIXME: https://github.com/muhlba91/pulumi-proxmoxve/issues/2
const provider = new proxmox.Provider('proxmoxve', {
  endpoint: process.env.PROXMOX_VE_ENDPOINT,
  insecure: true,
  username: process.env.PROXMOX_VE_USERNAME,
  password: process.env.PROXMOX_VE_PASSWORD,
});

/**
 * Creates a server.
 *
 * @param {string} prefix the prefix for the Pulumi resource
 * @param {string} hostname the server's hostname
 * @param {string} userPassword the user's password
 * @param {string} sshPublicKey the SSH public key (OpenSSH)
 * @param {ServerConfig} server the data for the server
 * @returns {ServerData} the generated server
 */
export const createServer = (
  prefix: string,
  hostname: string,
  userPassword: string,
  sshPublicKey: string,
  server: ServerConfig,
): ServerData => {
  const vendorConfig = new proxmox.storage.File(
    'vendor-config-' + prefix + '-' + hostname + '-' + environment,
    {
      contentType: 'snippets',
      datastoreId: pveConfig.localStoragePool,
      nodeName: server.host,
      sourceRaw: {
        data: readFileContents('assets/vendor-config.yml'),
        fileName:
          'vendor-config-' +
          prefix +
          '-' +
          hostname +
          '-' +
          environment +
          '.yml',
      },
    },
    {
      provider: provider,
    },
  );

  const machine = new proxmox.vm.VirtualMachine(
    'vm-' + prefix + '-' + hostname + '-' + environment,
    {
      nodeName: server.host,
      agent: {
        enabled: true, // toggles checking for ip addresses through qemu-guest-agent
        trim: true,
        type: 'virtio',
        timeout: '20m',
      },
      bios: 'seabios',
      cpu: {
        cores: server.cpu,
        sockets: server.sockets ?? 1,
        type: server.cpuType ?? pveConfig.cpuType,
      },
      disks: [
        {
          interface: 'scsi0',
          datastoreId: pveConfig.storagePool,
          fileId: pveConfig.imageName,
          size: server.diskSize,
          fileFormat: 'raw',
          ssd: true,
          iothread: true,
          discard: 'on',
        },
      ],
      efiDisk: {
        datastoreId: pveConfig.storagePool,
        preEnrolledKeys: false,
        fileFormat: 'raw',
        type: '4m',
      },
      scsiHardware: 'virtio-scsi-single',
      memory: {
        dedicated: server.memory.max,
        floating: server.memory.min,
      },
      name: hostname,
      networkDevices: [
        {
          bridge: pveConfig.networkBridge,
          model: 'virtio',
        },
      ],
      onBoot: true,
      startup: {
        order: server.startupOrder,
      },
      operatingSystem: {
        type: 'l26',
      },
      initialization: {
        type: 'nocloud',
        datastoreId: pveConfig.storagePool,
        vendorDataFileId: vendorConfig.id,
        interface: 'ide2',
        dns: {
          domain: networkConfig.domain,
          server: networkConfig.nameservers.join(' '),
        },
        ipConfigs: [
          {
            ipv4: {
              address: `${server.ipv4Address}/${networkConfig.ipv4.cidrMask}`,
              gateway: networkConfig.ipv4.gateway,
            },
            ipv6: {
              address: `${server.ipv6Address}/${networkConfig.ipv6.cidrMask}`,
              gateway: networkConfig.ipv6.gateway,
            },
          },
        ],
        userAccount: {
          username: username,
          password: userPassword,
          keys: [sshPublicKey],
        },
      },
      started: true,
      tags: [clusterConfig.name + '-cluster', environment].sort(),
    },
    {
      provider: provider,
      ignoreChanges: [
        'disks[0].speed',
        'disks[0].fileFormat',
        'cdrom',
        'efiDisk',
        'startup.downDelay',
        'startup.upDelay',
      ],
    },
  );
  return {
    resource: machine,
    serverId: machine.vmId,
    hostname: hostname,
    ipv4Address: server.ipv4Address,
    ipv6Address: server.ipv6Address,
  };
};
