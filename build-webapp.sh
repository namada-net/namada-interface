#!/bin/bash

# This script enables deployment of Namadillo to Laconic Network Service Providers.
# These are independent operators of bare metal k8s, each running the Laconic
# automated deployment infrastructure. By publishing records onchain and sending
# payment on testnet, various services can be deployed in many jurisdiction.
#
# The linked deploy script will be triggered by new Namadillo releases via Actions
# in the accompanying repo.
#
# https://git.vdb.to/LaconicNetwork/hosted-frontends/src/branch/main/deploy.sh
#
# It publishes records to the Laconic Network and triggers a Service
# Provider deployment at: https://namadillo.apps.vaasl.io

PKG_DIR="./apps/namadillo"
OUTPUT_DIR="${PKG_DIR}/dist"
DEST_DIR=${1:-/data}

if [[ -d "$DEST_DIR" ]]; then
  echo "${DEST_DIR} already exists." 1>&2
  exit 1
fi

# from the namada-interface README, modified for compatibility
apt-get update
apt-get install build-essential

yarn || exit 1
yarn prepare || exit 1

yarn --cwd ${PKG_DIR} wasm:build:multicore || exit 1
yarn --cwd ${PKG_DIR} build:only || exit 1

if [[ ! -d "$OUTPUT_DIR" ]]; then
  echo "Missing output directory: $OUTPUT_DIR" 1>&2
  exit 1
fi

mv "$OUTPUT_DIR" "$DEST_DIR"
