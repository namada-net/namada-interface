import { StringPointer, VecStringPointer, VecU8Pointer } from "./sdk/sdk";
declare const readVecU8Pointer: ({ pointer, length }: VecU8Pointer, memory: WebAssembly.Memory) => Uint8Array;
declare const readStringPointer: (stringPointer: StringPointer, memory: WebAssembly.Memory) => string;
declare const readVecStringPointer: ({ pointers, lengths }: VecStringPointer, memory: WebAssembly.Memory) => string[];
export { readStringPointer, readVecStringPointer, readVecU8Pointer };
