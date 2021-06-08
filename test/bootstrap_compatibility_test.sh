#!/bin/bash
set -eo pipefail

if [ "$#" -ne 1 ]; then
    echo "Missing arguments!"
    exit 1
fi
TEST_WITH_NODE_VERSION=$1
set -u

SRC_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"/..
TMP_DIR=$(mktemp -d -t ci-XXXXXXXXXX)
trap '{ rm -rf $TMP_DIR; }' EXIT

echo "Initialize tests for Node.js $TEST_WITH_NODE_VERSION in $TMP_DIR"

cp -a "$SRC_DIR/dist" "$TMP_DIR/"
cp -a "$SRC_DIR/vendor" "$TMP_DIR/"
cp "$SRC_DIR/package.json" "$TMP_DIR/"

pushd "$TMP_DIR" > /dev/null

. /usr/local/opt/nvm/nvm.sh # This loads nvm

nvm install $TEST_WITH_NODE_VERSION
nvm use $TEST_WITH_NODE_VERSION
npm install --production

popd > /dev/null

pushd "$SRC_DIR" > /dev/null

nvm use
npm test  -- -- "--distpath=$TMP_DIR" "--nodeversion=$TEST_WITH_NODE_VERSION"

popd > /dev/null
  