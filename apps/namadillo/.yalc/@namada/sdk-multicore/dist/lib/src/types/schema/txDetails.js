var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-unused-vars */
import { field, option, vec } from "@dao-xyz/borsh";
import { WrapperTxMsgValue } from "./wrapperTx";
export class MaspTxIn {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: "string" })
], MaspTxIn.prototype, "token", void 0);
__decorate([
    field({ type: "string" })
], MaspTxIn.prototype, "value", void 0);
__decorate([
    field({ type: "string" })
], MaspTxIn.prototype, "owner", void 0);
export class MaspTxOut {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: "string" })
], MaspTxOut.prototype, "token", void 0);
__decorate([
    field({ type: "string" })
], MaspTxOut.prototype, "value", void 0);
__decorate([
    field({ type: "string" })
], MaspTxOut.prototype, "address", void 0);
export class CommitmentMsgValue {
    constructor(data) {
        const maspTxIn = data.maspTxIn ?
            data.maspTxIn.map((txIn) => new MaspTxIn(txIn))
            : undefined;
        const maspTxOut = data.maspTxOut ?
            data.maspTxOut.map((txOut) => new MaspTxOut(txOut))
            : undefined;
        Object.assign(this, Object.assign(Object.assign({}, data), { maspTxIn,
            maspTxOut }));
    }
}
__decorate([
    field({ type: "u8" })
], CommitmentMsgValue.prototype, "txType", void 0);
__decorate([
    field({ type: "string" })
], CommitmentMsgValue.prototype, "hash", void 0);
__decorate([
    field({ type: "string" })
], CommitmentMsgValue.prototype, "txCodeId", void 0);
__decorate([
    field({ type: vec("u8") })
], CommitmentMsgValue.prototype, "data", void 0);
__decorate([
    field({ type: option("string") })
], CommitmentMsgValue.prototype, "memo", void 0);
__decorate([
    field({ type: option(vec(MaspTxIn)) })
], CommitmentMsgValue.prototype, "maspTxIn", void 0);
__decorate([
    field({ type: option(vec(MaspTxOut)) })
], CommitmentMsgValue.prototype, "maspTxOut", void 0);
export class TxDetailsMsgValue {
}
__decorate([
    field({ type: WrapperTxMsgValue })
], TxDetailsMsgValue.prototype, "wrapperTx", void 0);
__decorate([
    field({ type: vec(CommitmentMsgValue) })
], TxDetailsMsgValue.prototype, "commitments", void 0);
