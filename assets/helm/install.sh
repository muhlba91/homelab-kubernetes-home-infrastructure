#! /bin/sh

set -e

while [ ! -f ./outputs/${ENVIRONMENT}/admin.conf ]; do sleep 5; done
while [ ! -f "${VALUES_FILE}" ]; do sleep 5; done

helm repo add ${DEPLOYMENT_ID} ${HELM_REPO} &>/dev/null
helm repo update &>/dev/null

if `helm status --kubeconfig=./outputs/${ENVIRONMENT}/admin.conf --namespace=${DEPLOYMENT_NAMESPACE} ${DEPLOYMENT_ID} &>/dev/null`; then
  echo "${DEPLOYMENT_ID} already installed. skipping..."
else
  echo "${DEPLOYMENT_ID} not installed. installing..."
  helm install --kubeconfig=./outputs/${ENVIRONMENT}/admin.conf --namespace=${DEPLOYMENT_NAMESPACE} --create-namespace ${DEPLOYMENT_ID} ${DEPLOYMENT_ID}/${HELM_CHART_NAME} --values ${VALUES_FILE} --wait &>/dev/null || true
fi
