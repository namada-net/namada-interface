FROM rust:1.85.1 AS builder
WORKDIR /app

RUN apt update && apt install -y nodejs npm
RUN npm install -g yarn

COPY .yarnrc.yml tsconfig.base.json package.json yarn.lock ./
COPY ./.yarn ./.yarn
COPY ./packages ./packages
COPY ./apps/namadillo/package.json ./apps/namadillo/package.json

RUN yarn 

WORKDIR /app/apps/namadillo

COPY ./apps/namadillo .
RUN yarn && yarn build

FROM nginx:alpine
WORKDIR /app

COPY --from=builder /app/apps/namadillo/dist /usr/share/nginx/html
COPY ./docker/namadillo/nginx.conf /etc/nginx/conf.d/default.conf

COPY --chmod=0755 ./docker/namadillo/bootstrap_config.sh /docker-entrypoint.d/bootstrap_config.sh

RUN chown nginx:nginx /docker-entrypoint.d/bootstrap_config.sh
