#!/bin/bash
set -eo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 v[TARGET_NODE_VERSION]"
    echo "E.g. $0 v0.10"
    echo "or with 'npm run test:compatibility -- v0.10'"
    exit 1
fi
TEST_WITH_NODE_VERSION=$1
set -u

NVM_DIR=${NVM_DIR:-$HOME/.nvm}
unset npm_config_prefix
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

SRC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"/..
TMP_DIR=$(mktemp -d -t ci-XXXXXXXXXX)
trap '{ rm -rf $TMP_DIR; }' EXIT

echo "Initialize tests for Node.js $TEST_WITH_NODE_VERSION in $TMP_DIR"

cp -a "$SRC_DIR/dist" "$TMP_DIR/"
cp -a "$SRC_DIR/vendor" "$TMP_DIR/"
cp "$SRC_DIR/package.json" "$TMP_DIR/"

pushd "$TMP_DIR" > /dev/null

nvm install $TEST_WITH_NODE_VERSION
nvm use $TEST_WITH_NODE_VERSION
npm install --production

popd > /dev/null

pushd "$SRC_DIR" > /dev/null

nvm use
npm test  -- -- "--distpath=$TMP_DIR" "--nodeversion=$TEST_WITH_NODE_VERSION"

popd > /dev/null
  