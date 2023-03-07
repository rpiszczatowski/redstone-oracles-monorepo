set -e # to exit when any command fails
set -x # to display commands during execution

printTitle() {
  echo "\n\n$1"
}

printTitle "Spinning up a mongo-db-in-memory"
# TODO: implement

printTitle "Launching a cache service"
cd ../cache-service
# TODO: prepare env file there
yarn start &
CACHE_SERVICE_PID=$!
# The app will be launched at http://localhost:3000


printTitle "Launching 1 iteration of a node"
cd ../oracle-node
# TODO: prepare env file there (in env we will specify the number of iterations that should pass before the node should stop)
yarn start > oracle-node.log


printTitle "Testing evm-connector with smart contracts"
cd ../evm-connector
# yarn test special-test-for-custom-but-real-oracle-gateways.test.ts

# Stop cache service
kill $CACHE_SERVICE_PID
