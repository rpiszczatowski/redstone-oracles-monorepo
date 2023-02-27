FROM node:18

WORKDIR /app

COPY package.json package.json

RUN yarn

COPY . .

ENV ITERATION_INTERVAL=1000
ENV RPC_URL="https://beta-3.fuel.network/graphql"

RUN yarn build

CMD [ "yarn", "start" ]
