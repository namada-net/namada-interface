# @namada/sdk-multicore

This package is the build target for `@namada/sdk-multicore` and provides SDK initialization
specific to Web projects which require multicore functionality.

## Usage

```bash
# npm
npm install @namada/sdk-multicore

# yarn
yarn add @namada/sdk-multicore
```

```typescript
import { initSdk } from "@namada/sdk-multicore";
// If using Vite, the following is recommended:
// import { initSdk } from "@namada/sdk-multicore/inline";

const app = async () => {
  // Initialize the SDK with basic options
  const rpcUrl = "https://rpc.campfire.tududes.com";
  const token = "tnam1qy440ynh9fwrx8aewjvvmu38zxqgukgc259fzp6h";
  const sdk = await initSdk({ token, rpcUrl });
  const { tx, rpc, signing } = sdk;
  // ...
};

app();
```
