const decoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
const getUint8Memory = (memory) => new Uint8Array(memory.buffer);
const readVecU8Pointer = ({ pointer, length }, memory) => getUint8Memory(memory).subarray(pointer, pointer + length);
const readStringPointer = (stringPointer, memory) => decoder.decode(readVecU8Pointer(stringPointer, memory));
const readVecStringPointer = ({ pointers, lengths }, memory) => {
    const memoryBuffer = getUint8Memory(memory);
    return Array.from(pointers).map((p, i) => decoder.decode(memoryBuffer.subarray(p, p + lengths[i])));
};
export { readStringPointer, readVecStringPointer, readVecU8Pointer };
