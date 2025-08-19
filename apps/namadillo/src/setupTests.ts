import "@testing-library/jest-dom";
import { atom } from "jotai";
import { TextDecoder, TextEncoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

jest.mock("atoms/integrations", () => ({
  getRestApiAddressByIndex: jest.fn(),
  getRpcByIndex: jest.fn(),
}));

jest.mock("atoms/integrations/atoms", () => ({
  localnetConfigAtom: atom({ data: undefined }),
}));

// Because we run tests in node environment, we need to mock inline-init as node-init
jest.mock(
  "@namada/sdk-multicore/inline",
  () => () => Promise.resolve(jest.requireActual("@namada/sdk-node").default())
);
