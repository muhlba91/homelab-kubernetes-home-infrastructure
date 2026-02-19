package cluster

import (
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

// Data defines a cluster.
type Data struct {
	// Kubeconfig is the kubeconfig for the cluster.
	Kubeconfig pulumi.StringOutput
	// Talosconfig is the talosconfig for the cluster.
	Talosconfig pulumi.StringOutput
	// Provider is the Kubernetes provider for the cluster.
	Provider *kubernetes.Provider
}
