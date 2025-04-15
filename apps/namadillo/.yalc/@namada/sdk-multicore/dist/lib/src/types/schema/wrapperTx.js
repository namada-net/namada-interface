var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-unused-vars */
import { field, option } from "@dao-xyz/borsh";
import { BigNumberSerializer } from "./utils";
export class WrapperTxMsgValue {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: "string" })
], WrapperTxMsgValue.prototype, "token", void 0);
__decorate([
    field(BigNumberSerializer)
], WrapperTxMsgValue.prototype, "feeAmount", void 0);
__decorate([
    field(BigNumberSerializer)
], WrapperTxMsgValue.prototype, "gasLimit", void 0);
__decorate([
    field({ type: "string" })
], WrapperTxMsgValue.prototype, "chainId", void 0);
__decorate([
    field({ type: option("string") })
], WrapperTxMsgValue.prototype, "publicKey", void 0);
__decorate([
    field({ type: option("string") })
], WrapperTxMsgValue.prototype, "memo", void 0);
__decorate([
    field({ type: option("bool") })
], WrapperTxMsgValue.prototype, "force", void 0);
__decorate([
    field({ type: option("u64") })
], WrapperTxMsgValue.prototype, "expiration", void 0);
__decorate([
    field({ type: option("string") })
], WrapperTxMsgValue.prototype, "wrapperFeePayer", void 0);
