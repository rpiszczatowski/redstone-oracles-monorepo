set -e # to exit when any command fails
set -x # to display commands during execution

MONGO_URI_FILE=./tmp-mongo-db-uri.log

printTitle() {
  echo "\n\n$1"
}

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

waitForFile() {
  until [ -f $1 ]
  do
    sleep 5
  done
}

updateDotEnvFile() {
  varName=$1
  newValue=$2
  find ./.env -type f -exec sed -i '' -e "/^$varName=/s/=.*/=\'$newValue\'/" {} \;
}

runWithLogPrefix() {
  cmd=$1
  logPrefix=$2
  $cmd > >(trap "" INT TERM; sed "s/^/$logPrefix: /") 2> >(trap "" INT TERM; sed "s/^/$logPrefix (stderr): /")
}

main() {
  cd ../cache-service
  installAndBuild

  # Spinning up a mongo DB instance for cache service
  rm -f $MONGO_URI_FILE
  runWithLogPrefix "yarn run-ts scripts/launch-mongodb-in-memory.ts" "mongo-db" &
  waitForFile $MONGO_URI_FILE
  MEMORY_MONGO_DB_URL=$(cat $MONGO_URI_FILE)

  # Run cache layer
  cp .env.example .env
  updateDotEnvFile "MONGO_DB_URL" "$MEMORY_MONGO_DB_URI"
  updateDotEnvFile "API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES" "hehe"
  updateDotEnvFile "ENABLE_DIRECT_POSTING_ROUTES" "true"
  updateDotEnvFile "ENABLE_STREAMR_LISTENING" "false"
  cat .env
  # runWithLogPrefix "yarn start" "cache-service" &

  # Launching one iteration of oracle-node
  # cd ../oracle-node
  # installAndBuild
  # cp .env.example .env
  # runWithLogPrefix "OVERRIDE_DIRECT_CACHE_SERVICE_URLS=[http://localhost:3000] yarn run-ts tools/"

  # Checking if data packages are accessible from cache service
  # curl http://localhost:3000/data-packages

  # Using data in evm-connector
  # TODO: implement later

  # Stop cache service
  pkill -f cache-service/node_modules/.bin/nest start

  # Close mongo DB
  # Note! It doesn't work with last pid because of mongod "features"
  pkill -f scripts/launch-mongodb-in-memory.ts
}

# Run the script
main

