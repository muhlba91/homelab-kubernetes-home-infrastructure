package scaleway

// Config defines configuration data for GCP.
type Config struct {
	// Project is the GCP project ID.
	Project string `yaml:"project,omitempty"`
	// DNSProject is the GCP project ID for DNS.
	DNSProject string `yaml:"dnsProject,omitempty"`
}
