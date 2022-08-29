FROM node:16-alpine
WORKDIR /app
COPY package.json package.json
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY frontend/yarn.lock frontend/yarn.lock
COPY backend/yarn.lock backend/yarn.lock

RUN apk update && apk add git
RUN apk add --update python3 make g++
RUN apk add --update cmake
RUN apk add --update libressl-dev
RUN yarn install --frozen-lockfile

COPY . .

ENV MONGO_DB_URL=mongodb://mongodb:27017/redstone-oracle-monitoring?retryWrites=true&w=majority
ENV BACKEND_URL=http://127.0.0.1:3000/api
ENV UPTIME_KUMA_URL=

EXPOSE 3000

RUN yarn backend:build
RUN yarn frontend:docker:build

CMD [ "yarn", "backend:start" ]
