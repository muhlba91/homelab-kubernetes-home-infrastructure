package cilium

// Config defines configuration data for Cilium.
type Config struct {
	// PodSubnets is the IP address configuration for pod subnets.
	PodSubnets *IPAddressConfig `yaml:"podSubnets,omitempty"`
}

// IPAddressConfig defines configuration data for IP addresses on Cilium.
type IPAddressConfig struct {
	// V4 is the IPv4 address configuration.
	V4 string `yaml:"v4,omitempty"`
	// V6 is the IPv6 address configuration.
	V6 string `yaml:"v6,omitempty"`
}
