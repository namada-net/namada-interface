var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { field } from "@dao-xyz/borsh";
export class MaxMaspTxAmountMsgValue {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: "string" })
], MaxMaspTxAmountMsgValue.prototype, "source", void 0);
__decorate([
    field({ type: "string" })
], MaxMaspTxAmountMsgValue.prototype, "target", void 0);
__decorate([
    field({ type: "string" })
], MaxMaspTxAmountMsgValue.prototype, "token", void 0);
__decorate([
    field({ type: "string" })
], MaxMaspTxAmountMsgValue.prototype, "feeToken", void 0);
__decorate([
    field({ type: "string" })
], MaxMaspTxAmountMsgValue.prototype, "amount", void 0);
__decorate([
    field({ type: "string" })
], MaxMaspTxAmountMsgValue.prototype, "feeAmount", void 0);
