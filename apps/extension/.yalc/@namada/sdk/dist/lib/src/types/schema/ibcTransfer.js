var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-unused-vars */
import { field, option, vec } from "@dao-xyz/borsh";
import { BparamsConvertMsgValue, BparamsMsgValue, BparamsOutputMsgValue, BparamsSpendMsgValue, } from "./bparams";
import { BigNumberSerializer } from "./utils";
export class IbcTransferMsgValue {
    constructor(data) {
        var _a;
        Object.assign(this, Object.assign(Object.assign({}, data), { bparams: (_a = data.bparams) === null || _a === void 0 ? void 0 : _a.map((bparam) => {
                return new BparamsMsgValue({
                    spend: new BparamsSpendMsgValue(bparam.spend),
                    output: new BparamsOutputMsgValue(bparam.output),
                    convert: new BparamsConvertMsgValue(bparam.convert),
                });
            }) }));
    }
}
__decorate([
    field({ type: "string" })
], IbcTransferMsgValue.prototype, "source", void 0);
__decorate([
    field({ type: "string" })
], IbcTransferMsgValue.prototype, "receiver", void 0);
__decorate([
    field({ type: "string" })
], IbcTransferMsgValue.prototype, "token", void 0);
__decorate([
    field(BigNumberSerializer)
], IbcTransferMsgValue.prototype, "amountInBaseDenom", void 0);
__decorate([
    field({ type: "string" })
], IbcTransferMsgValue.prototype, "portId", void 0);
__decorate([
    field({ type: "string" })
], IbcTransferMsgValue.prototype, "channelId", void 0);
__decorate([
    field({ type: option("u64") })
], IbcTransferMsgValue.prototype, "timeoutHeight", void 0);
__decorate([
    field({ type: option("u64") })
], IbcTransferMsgValue.prototype, "timeoutSecOffset", void 0);
__decorate([
    field({ type: option("string") })
], IbcTransferMsgValue.prototype, "memo", void 0);
__decorate([
    field({ type: option(vec("u8")) })
], IbcTransferMsgValue.prototype, "shieldingData", void 0);
__decorate([
    field({ type: option("string") })
], IbcTransferMsgValue.prototype, "gasSpendingKey", void 0);
__decorate([
    field({ type: option(vec(BparamsMsgValue)) })
], IbcTransferMsgValue.prototype, "bparams", void 0);
__decorate([
    field({ type: option("string") })
], IbcTransferMsgValue.prototype, "refundTarget", void 0);
