#!/bin/bash

set -eo pipefail
TMP_DIR="$1"
NODE_VERSION="$2"
set -u

pushd "$TMP_DIR" > /dev/null

NVM_DIR=${NVM_DIR:-$HOME/.nvm}

if [ -f "$NVM_DIR/nvm.sh" ]; then
    echo "Loading nvm from $NVM_DIR/nvm.sh"
    . "$NVM_DIR/nvm.sh"
elif [ -f "/usr/local/opt/nvm/nvm.sh" ]; then 
    echo "Loading nvm from /usr/local/opt/nvm/nvm.sh"
    . "/usr/local/opt/nvm/nvm.sh"
fi

if ! command -v nvm &> /dev/null
then
    echo "nvm could not be found"
    echo "Please install NVM and make sure NVM_DIR env variable is set before running this script. tip: https://github.com/nvm-sh/nvm#install--update-script"
    exit
fi

nvm use $NODE_VERSION

"./dist/cli.js" "${@:3}"

popd > /dev/null

