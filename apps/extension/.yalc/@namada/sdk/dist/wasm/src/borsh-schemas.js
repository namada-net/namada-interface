var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { field, option, vec } from "@dao-xyz/borsh";
import BigNumber from "bignumber.js";
export const BigNumberSerializer = {
    serialize: (value, writer) => {
        writer.string(value.toString());
    },
    deserialize: (reader) => {
        const valueString = reader.string();
        return new BigNumber(valueString);
    },
};
export class Proposal {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: "u64" })
], Proposal.prototype, "id", void 0);
__decorate([
    field({ type: "string" })
], Proposal.prototype, "content", void 0);
__decorate([
    field({ type: "string" })
], Proposal.prototype, "author", void 0);
__decorate([
    field({ type: "u64" })
], Proposal.prototype, "startEpoch", void 0);
__decorate([
    field({ type: "u64" })
], Proposal.prototype, "endEpoch", void 0);
__decorate([
    field({ type: "u64" })
], Proposal.prototype, "graceEpoch", void 0);
__decorate([
    field({ type: "string" })
], Proposal.prototype, "tallyType", void 0);
__decorate([
    field({ type: "string" })
], Proposal.prototype, "proposalType", void 0);
__decorate([
    field({ type: option("string") })
], Proposal.prototype, "data", void 0);
export class Proposals {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: vec(Proposal) })
], Proposals.prototype, "proposals", void 0);
