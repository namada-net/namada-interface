FROM ubuntu:24.04 AS builder
WORKDIR /app

RUN apt update && apt install -y nodejs npm
RUN npm install -g yarn

COPY .yarnrc.yml tsconfig.base.json package.json yarn.lock .
COPY ./.yarn ./.yarn
COPY ./packages ./packages
COPY ./apps/faucet/package.json ./apps/faucet/package.json

RUN yarn 

WORKDIR /app/apps/faucet

COPY ./apps/faucet .
RUN yarn 
RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/apps/faucet/build /usr/share/nginx/html
COPY ./docker/faucet/nginx.conf /etc/nginx/conf.d/default.conf
