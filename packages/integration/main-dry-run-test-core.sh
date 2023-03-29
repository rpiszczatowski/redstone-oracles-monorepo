set -e # to exit when any command fails
set -x # to display commands during execution

export MONOREPO_INTEGRATION_TEST=true
CACHE_SERVICE_URL=http://localhost:3000
HARDHAT_MOCK_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

installAndBuild() {
  # Lazily install NPM deps
  if [ -d "node_modules" ]; then
    echo "Node modules are already installed. Skipping..."
  else
    echo "Installing NPM deps"
    yarn > /dev/null
    echo "Installed NPM deps"
  fi

  # Lazily build typescript code
  if [ -d "dist" ]; then
    echo "Already built. Skipping..."
  else
    echo "Building typescript"
    yarn build > /dev/null
    echo "Building completed"
  fi
}

updateDotEnvFile() {
  varName=$1
  newValue=$(echo $2 | sed 's;/;\\/;g') # escaping all slashes
  find ./.env -type f -exec sed -i '' -e "/^$varName=/s/=.*/=\'$newValue\'/" {} \;
}

waitForTextInNodeLogs() {
  textToFind=$1
  filename=$2
  until [ $(grep -c -w "$textToFind" $filename) -ge 1 ]
  do
    sleep 5
  done
}


main() {
  # Launching oracle-node
  cd ../oracle-node
  installAndBuild
  cp .env.example .env
  updateDotEnvFile "OVERRIDE_DIRECT_CACHE_SERVICE_URLS" '["http://localhost:3000"]'
  updateDotEnvFile "OVERRIDE_MANIFEST_USING_FILE" "./manifests/data-services/main.json"
  updateDotEnvFile "ECDSA_PRIVATE_KEY" $HARDHAT_MOCK_PRIVATE_KEY
  
  node dist/index.js > tmp.out &
  nodePid=$!
  waitForTextInNodeLogs "Fetched price : USDT" "tmp.out"
  waitForTextInNodeLogs "Fetched price : ETH" "tmp.out"
  waitForTextInNodeLogs "Fetched price : BTC" "tmp.out"
  waitForTextInNodeLogs "Fetched price : DAI" "tmp.out"
  waitForTextInNodeLogs "Fetched price : VST" "tmp.out"
  waitForTextInNodeLogs "Fetched price : OHM" "tmp.out"
  kill -9 $nodePid
  yarn test test/monorepo-integration-test/main-dry-run.spec.ts
}

# Run the script
main

