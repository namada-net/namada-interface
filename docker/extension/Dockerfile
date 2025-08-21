FROM --platform=linux/arm64 rust:1.79 AS builder

WORKDIR /app

# Installing required packages
RUN apt update && apt install -y nodejs npm clang pkg-config libssl-dev protobuf-compiler curl binaryen
RUN npm install -g yarn
RUN rustup toolchain add nightly-2025-03-27
RUN rustup target add wasm32-unknown-unknown
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh -s -- -y

# Copying packages and scripts related to the monorepo
COPY .yarnrc.yml tsconfig.base.json package.json yarn.lock .
COPY ./.yarn ./.yarn
COPY ./packages ./packages
COPY ./scripts ./scripts
COPY ./apps/extension/package.json ./apps/extension/package.json

# Installing packages
RUN yarn 
WORKDIR /app/apps/extension

# Building extension dist files
COPY ./apps/extension .
RUN yarn

FROM builder AS firefox
RUN yarn build:firefox

FROM builder AS chrome
RUN yarn build:chrome


