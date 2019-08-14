# ---- base node version ---- #
FROM node:lts-buster-slim AS base

WORKDIR /home/uke-webserver/app

# ---- dependencies ---- #
FROM base AS dependencies
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install --production
# If you are building your code for production
# RUN npm ci --only=production

# ---- build ---- #
FROM dependencies AS build

# Bundle app source
COPY . .

# ---- release ---- #
# FROM node:lts-buster-slim AS release

EXPOSE 28101 28102 6650 8890

RUN npm install pm2 -g
ENV NODE_ENV=production
CMD ["pm2-runtime", "system/index.js"]
