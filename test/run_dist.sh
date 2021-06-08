#!/bin/bash

set -eo pipefail
TMP_DIR="$1"
NODE_VERSION="$2"
set -u

pushd "$TMP_DIR" > /dev/null

# TODO: Need to get nvm dir from somewhere?
. /usr/local/opt/nvm/nvm.sh # This loads nvm

nvm use $NODE_VERSION

"./dist/cli.js" "${@:3}"

popd > /dev/null

