#! /bin/sh

set -e

while [ ! -f ./outputs/admin.conf ]; do sleep 5; done
while [ ! -f ./outputs/values-${DEPLOYMENT_ID}.yml ]; do sleep 5; done

helm repo add ${DEPLOYMENT_ID} ${HELM_REPO} &>/dev/null
helm repo update &>/dev/null

if `helm status --kubeconfig=./outputs/admin.conf --namespace=${DEPLOYMENT_NAMESPACE} ${DEPLOYMENT_ID}-${DEPLOYMENT_ENV} &>/dev/null`; then
  echo "${DEPLOYMENT_ID} already installed. skipping..."
else
  echo "${DEPLOYMENT_ID} not installed. installing..."
  helm install --kubeconfig=./outputs/admin.conf --namespace=${DEPLOYMENT_NAMESPACE} --create-namespace ${DEPLOYMENT_ID}-${DEPLOYMENT_ENV} ${DEPLOYMENT_ID}/${HELM_CHART_NAME} --values ./outputs/values-${DEPLOYMENT_ID}.yml &>/dev/null || true
fi
