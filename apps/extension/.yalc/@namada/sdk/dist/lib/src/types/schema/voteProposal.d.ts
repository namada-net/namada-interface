import { VoteProposalProps } from "../types";
export declare class VoteProposalMsgValue {
    signer: string;
    proposalId: bigint;
    vote: string;
    constructor(data: VoteProposalProps);
}
