import { BinaryReader, BinaryWriter } from "@dao-xyz/borsh";
import BigNumber from "bignumber.js";
export declare const BigNumberSerializer: {
    serialize: (value: BigNumber, writer: BinaryWriter) => void;
    deserialize: (reader: BinaryReader) => BigNumber;
};
