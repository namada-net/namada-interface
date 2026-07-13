# faucet

This is a front-end app to the [namada-faucet](https://github.com/heliaxdev/namada-faucet) server.

## Table of Contents

- [Setup](#setup)
- [Local Development](#local-development)
- [Proxying Requests](#proxying-requests)
- [Building the Project](#building-the-project)
- [Notes](#notes)

## Setup

To install dependencies, from the root `namada-interface` folder, run the following:

```bash
yarn
```

Then, look at the potential variables you may override in [.env.sample](./.env.sample) in `apps/faucet`. You can copy these variables into a `.env` file,
and they will be used when the application is built.

As an example, if all you want to override the API url or endpoint, you can override the following default values in a `.env`:

```bash
# Faucet API Endpoint override
NAMADA_INTERFACE_FAUCET_API_URL=http://127.0.0.1:5000
NAMADA_INTERFACE_FAUCET_API_ENDPOINT=/api/v1/faucet
```

[ [Table of Contents](#table-of-contents) ]

## Local Development

In `apps/faucet`, you can issue the following command to run the Faucet app locally in development mode:

```bash
yarn dev
```

The app will be accessible at `http://localhost:8081`.

[ [Table of Contents](#table-of-contents) ]

## Proxying Requests

If you are experiencing request failures due to CORS origin problems (e.g., if you are connecting to a remote server from a local dev instance),
you can launch the local CORS proxy via the following:

```bash
yarn dev:proxy
```

This will proxy the `NAMADA_INTERFACE_FAUCET_API_URL` (or default URL if this is unspecified) via a Node server, which should resolve the issue.

[ [Table of Contents](#table-of-contents) ]

## Building the project

To build the final, static HTML version of this app, simply run the following:

```bash
yarn build
```

This will build the production version of the app, and the resulting bundle will be available in `apps/faucet/build`. This contents of this folder can be served on a web host
as a static HTML website.

[ [Table of Contents](#table-of-contents) ]

## Notes

The logic for the API calls, as well as the mining logic can be found in [utils/](./src/utils/).

The form interface where these calls are invoked is located in [Faucet.tsx](./src/App/Faucet.tsx).

[ [Table of Contents](#table-of-contents) ]
