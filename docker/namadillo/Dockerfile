FROM rust:1.85.1 AS builder
WORKDIR /app

RUN apt update && apt install -y nodejs npm clang pkg-config libssl-dev protobuf-compiler curl
RUN npm install -g yarn

RUN rustup toolchain add nightly-2025-03-27
RUN rustup target add wasm32-unknown-unknown
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -y

COPY .yarnrc.yml tsconfig.base.json package.json yarn.lock ./
COPY ./.yarn ./.yarn
COPY ./packages ./packages
COPY ./scripts ./scripts
COPY ./apps/namadillo/package.json ./apps/namadillo/package.json

RUN yarn 

WORKDIR /app/apps/namadillo
COPY ./apps/namadillo/scripts ./scripts

RUN yarn wasm:build:multicore

COPY ./apps/namadillo .
RUN yarn && yarn build:only

FROM nginx:alpine
WORKDIR /app

COPY --from=builder /app/apps/namadillo/dist /usr/share/nginx/html
COPY ./docker/namadillo/nginx.conf /etc/nginx/conf.d/default.conf

COPY --chmod=0755 ./docker/namadillo/bootstrap_config.sh /docker-entrypoint.d/bootstrap_config.sh

RUN chown nginx:nginx /docker-entrypoint.d/bootstrap_config.sh
