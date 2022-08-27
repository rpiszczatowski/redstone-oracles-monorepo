FROM node:16

# Create app directory
RUN mkdir /app
WORKDIR /app

# Bundle app source
COPY . .

# Install dependencies.
RUN yarn

ENV NODE_ENV=production
