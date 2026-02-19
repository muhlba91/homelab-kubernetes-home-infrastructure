package gates

// Config defines gates configuration.
type Config struct {
	// HomeAssistant indicates if Home Assistant is enabled.
	HomeAssistant bool `yaml:"homeAssistant,omitempty"`
	// InfluxDB indicates if InfluxDB is enabled.
	InfluxDB bool `yaml:"influxdb,omitempty"`
	// ExternalDNS indicates if ExternalDNS is enabled.
	ExternalDNS bool `yaml:"externalDns,omitempty"`
	// CertManager indicates if CertManager is enabled.
	CertManager bool `yaml:"certManager,omitempty"`
	// Flux indicates if Flux is enabled.
	Flux bool `yaml:"flux,omitempty"`
	// Nvidia indicates if Nvidia is enabled.
	Nvidia bool `yaml:"nvidia,omitempty"`
	// CoralTPU indicates if Coral TPU is enabled.
	CoralTPU bool `yaml:"coralTpu,omitempty"`
	// Cluster indicates if the cluster is enabled.
	Cluster bool `yaml:"cluster,omitempty"`
}
