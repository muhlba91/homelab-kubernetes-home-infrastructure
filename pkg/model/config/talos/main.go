package talos

// Config defines configuration data for Talos.
type Config struct {
	// Machine is the machine configuration for Talos.
	Machine *MachineConfig `yaml:"machine,omitempty"`
	// Cluster is the cluster configuration for Talos.
	Cluster *ClusterConfig `yaml:"cluster,omitempty"`
}

// MachineConfig defines configuration data for a machine in Talos.
type MachineConfig struct {
	// Hostname is the hostname of the machine.
	Hostname string `yaml:"hostname,omitempty"`
	// Disk is the disk to install Talos on.
	Disk string `yaml:"disk,omitempty"`
	// Network is the network configuration for the machine.
	Network *MachineNetworkConfig `yaml:"network,omitempty"`
}

// ClusterConfig defines configuration data for a cluster in Talos.
type ClusterConfig struct {
	// InstallImageHash is the hash of the Talos install image.
	InstallImageHash string `yaml:"installImageHash,omitempty"`
	// VIP is the virtual IP address for the cluster.
	VIP string `yaml:"vip,omitempty"`
	// Revision is the revision of the cluster.
	Revision string `yaml:"revision,omitempty"`
	// Network is the network configuration for the cluster.
	Network *ClusterNetworkConfig `yaml:"network,omitempty"`
}

// ClusterNetworkConfig defines configuration data for the cluster network in Talos.
type ClusterNetworkConfig struct {
	// PodSubnets is the IP address configuration for pod subnets.
	PodSubnets *IPAddressConfig `yaml:"podSubnets,omitempty"`
	// ServiceSubnets is the IP address configuration for service subnets.
	ServiceSubnets *IPAddressConfig `yaml:"serviceSubnets,omitempty"`
}

// MachineNetworkConfig defines configuration data for a network for a machine on Talos.
type MachineNetworkConfig struct {
	// IP is the IP address configuration for the machine.
	IP *IPAddressConfig `yaml:"ip,omitempty"`
	// MAC is the MAC address of the machine.
	MAC string `yaml:"mac,omitempty"`
}

// IPAddressConfig defines configuration data for IP addresses on Talos.
type IPAddressConfig struct {
	// V4 is the IPv4 address configuration.
	V4 string `yaml:"v4,omitempty"`
	// V6 is the IPv6 address configuration.
	V6 string `yaml:"v6,omitempty"`
}
