ARG PACKAGE

FROM node:16 AS build
ARG PACKAGE

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY .yarnrc .

RUN yarn install --frozen-lockfile --non-interactive --production=false

COPY . .
RUN cd "packages/${PACKAGE}" && yarn install --frozen-lockfile --non-interactive --production=false && yarn build && yarn bundle 
# RUN mkdir -p jsons && find . -name "*.json" -exec cp --parents {} jsons \;

FROM node:16
ARG PACKAGE

# COPY --from=build "/app/yarn.lock" yarn.lock
# COPY --from=build "/app/packages/$PACKAGE/package.json" package.json 
COPY --from=build app/node_modules node_modules 

# RUN yarn install --pure-lockfile --non-interactive --production=true
COPY --from=build "/app/packages/$PACKAGE/dist/" .
# COPY --from=build app/jsons .

ARG DOCKER_IMAGE_TAG="no_tag"
ENV DOCKER_IMAGE_TAG=$DOCKER_IMAGE_TAG

ENTRYPOINT [ "node", "index.js" ]
