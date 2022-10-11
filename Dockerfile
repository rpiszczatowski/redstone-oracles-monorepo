FROM node:current-alpine3.16

# Create app directory
RUN mkdir /app
WORKDIR /app

# Install git (as it's required by some NPM deps)
RUN apk update && apk upgrade && apk add --no-cache bash git openssh

# Bundle app source
COPY . .

RUN yarn
