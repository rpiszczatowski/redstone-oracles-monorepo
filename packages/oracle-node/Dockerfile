# ---- Install and copy necessary files ----
FROM node:16 AS install
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY .yarnrc .

COPY packages/oracle-node/package.json ./packages/oracle-node/
COPY packages/protocol/package.json ./packages/protocol/
COPY packages/rpc-providers/package.json ./packages/rpc-providers/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/streamr-proxy/package.json ./packages/streamr-proxy/
COPY packages/utils/package.json ./packages/utils/
COPY packages/oracles-smartweave-contracts/package.json ./packages/oracles-smartweave-contracts/

RUN yarn install --frozen-lockfile --non-interactive --production=false

COPY packages/oracle-node ./packages/oracle-node
COPY packages/protocol ./packages/protocol
COPY packages/rpc-providers ./packages/rpc-providers
COPY packages/sdk ./packages/sdk
COPY packages/streamr-proxy ./packages/streamr-proxy
COPY packages/utils ./packages/utils
COPY packages/oracles-smartweave-contracts ./packages/oracles-smartweave-contracts

# ---- Build and obfuscate code ----
FROM install AS build
WORKDIR /app/packages/oracle-node
RUN apt-get update && apt-get install cpio
RUN yarn build
RUN yarn obfuscate
RUN yarn copy-jsons
RUN cd .. && rm -rf oracle-node && mv oracle-node-obfuscated oracle-node

# ---- Release ----
FROM node:16 AS release
WORKDIR /app
COPY package.json .
COPY yarn.lock .

COPY --from=build /app/packages/oracle-node ./packages/oracle-node

COPY --from=build /app/packages/protocol/dist ./packages/protocol/dist
COPY --from=build /app/packages/protocol/package.json ./packages/protocol/

COPY --from=build /app/packages/rpc-providers/dist ./packages/rpc-providers/dist
COPY --from=build /app/packages/rpc-providers/package.json ./packages/rpc-providers/

COPY --from=build /app/packages/sdk/dist ./packages/sdk/dist
COPY --from=build /app/packages/sdk/package.json ./packages/sdk/

COPY --from=build /app/packages/streamr-proxy/dist ./packages/streamr-proxy/dist
COPY --from=build /app/packages/streamr-proxy/package.json ./packages/streamr-proxy/

COPY --from=build /app/packages/utils/dist ./packages/utils/dist
COPY --from=build /app/packages/utils/package.json ./packages/utils/

COPY --from=build /app/packages/oracles-smartweave-contracts/dist ./packages/oracles-smartweave-contracts/dist
COPY --from=build /app/packages/oracles-smartweave-contracts/package.json ./packages/oracles-smartweave-contracts/

RUN yarn install --frozen-lockfile --non-interactive --production=true

ARG DOCKER_IMAGE_TAG

ENV ENABLE_JSON_LOGS=true
ENV ENABLE_PERFORMANCE_TRACKING=true
ENV PRINT_DIAGNOSTIC_INFO=true
ENV MANIFEST_REFRESH_INTERVAL=120000
ENV OVERRIDE_MANIFEST_USING_FILE=
ENV ECDSA_PRIVATE_KEY=
ENV OVERRIDE_PRICE_CACHE_SERVICE_URLS="[]"
ENV DOCKER_IMAGE_TAG=$DOCKER_IMAGE_TAG

CMD cd packages/oracle-node && node index.js
