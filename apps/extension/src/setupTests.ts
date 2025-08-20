import "fake-indexeddb/auto";
import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Because we run tests in node environment, we need to mock inline-init as node-init
jest.mock(
  "@namada/sdk/inline",
  () => () => Promise.resolve(jest.requireActual("@namada/sdk-node").default()),
  { virtual: true }
);
