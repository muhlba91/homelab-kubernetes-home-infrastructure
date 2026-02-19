package network

// Config defines network configuration.
type Config struct {
	// Nameservers is the list of nameservers.
	Nameservers []string `yaml:"nameservers,omitempty"`
	// Domain is the network domain.
	Domain string `yaml:"domain,omitempty"`
	// IPv4 is the IPv4 configuration.
	IPv4 *IPConfig `yaml:"ipv4,omitempty"`
	// IPv6 is the IPv6 configuration.
	IPv6 *IPConfig `yaml:"ipv6,omitempty"`
}

// IPConfig defines IPv network configuration.
type IPConfig struct {
	// Enabled indicates if the network is enabled.
	Enabled bool `yaml:"enabled,omitempty"`
	// CIDRMask is the CIDR mask for the network.
	CIDRMask int `yaml:"cidrMask,omitempty"`
	// Gateway is the gateway address.
	Gateway string `yaml:"gateway,omitempty"`
}
