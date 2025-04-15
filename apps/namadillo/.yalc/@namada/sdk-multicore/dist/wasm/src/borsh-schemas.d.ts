import { BinaryReader, BinaryWriter } from "@dao-xyz/borsh";
import BigNumber from "bignumber.js";
export declare const BigNumberSerializer: {
    serialize: (value: BigNumber, writer: BinaryWriter) => void;
    deserialize: (reader: BinaryReader) => BigNumber;
};
export declare class Proposal {
    id: bigint;
    content: string;
    author: string;
    startEpoch: bigint;
    endEpoch: bigint;
    graceEpoch: bigint;
    tallyType: string;
    proposalType: string;
    data?: string;
    constructor(data: Proposal);
}
export declare class Proposals {
    proposals: Proposal[];
    constructor(data: Proposals);
}
