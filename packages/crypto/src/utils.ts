import { StringPointer, VecStringPointer, VecU8Pointer } from "./crypto/crypto";

const decoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });

const getUint8Memory = (memory: WebAssembly.Memory): Uint8Array =>
  new Uint8Array(memory.buffer);

const readVecU8Pointer = (
  { pointer, length }: VecU8Pointer,
  memory: WebAssembly.Memory
): Uint8Array => getUint8Memory(memory).subarray(pointer, pointer + length);

const readStringPointer = (
  stringPointer: StringPointer,
  memory: WebAssembly.Memory
): string => decoder.decode(readVecU8Pointer(stringPointer, memory));

const readVecStringPointer = (
  { pointers, lengths }: VecStringPointer,
  memory: WebAssembly.Memory
): string[] => {
  const memoryBuffer = getUint8Memory(memory);
  return Array.from(pointers).map((p, i) =>
    decoder.decode(memoryBuffer.subarray(p, p + lengths[i]))
  );
};

export { readStringPointer, readVecStringPointer, readVecU8Pointer };
