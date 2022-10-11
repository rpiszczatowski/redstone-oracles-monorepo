FROM node:current-alpine3.16

# Create app directory
RUN mkdir /app
WORKDIR /app

# Bundle app source
COPY . .

RUN yarn
