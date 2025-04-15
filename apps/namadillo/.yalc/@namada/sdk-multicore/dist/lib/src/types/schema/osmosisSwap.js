var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { field, option, variant, vec } from "@dao-xyz/borsh";
import { IbcTransferMsgValue } from "./ibcTransfer";
class SlippageMsgValue {
}
let MinOutputAmount = class MinOutputAmount extends SlippageMsgValue {
    constructor(data) {
        super();
        Object.assign(this, data);
    }
};
__decorate([
    field({ type: "string" })
], MinOutputAmount.prototype, 0, void 0);
MinOutputAmount = __decorate([
    variant(0)
], MinOutputAmount);
export { MinOutputAmount };
export const isMinOutputAmount = (data) => {
    return typeof data[0] === "string";
};
let Twap = class Twap extends SlippageMsgValue {
    constructor(data) {
        super();
        Object.assign(this, data);
    }
};
__decorate([
    field({ type: "string" })
], Twap.prototype, "slippagePercentage", void 0);
__decorate([
    field({ type: "u64" })
], Twap.prototype, "windowSeconds", void 0);
Twap = __decorate([
    variant(1)
], Twap);
export { Twap };
export const isTwap = (data) => {
    return (typeof data.slippagePercentage === "string" &&
        typeof data.windowSeconds === "bigint");
};
export class OsmosisPoolHop {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: "string" })
], OsmosisPoolHop.prototype, "poolId", void 0);
__decorate([
    field({ type: "string" })
], OsmosisPoolHop.prototype, "tokenOutDenom", void 0);
export class OsmosisSwapMsgValue {
    constructor(data) {
        var _a;
        let slippage;
        if (isMinOutputAmount(data.slippage)) {
            slippage = new MinOutputAmount(data.slippage);
        }
        else if (isTwap(data.slippage)) {
            slippage = new Twap(data.slippage);
        }
        else {
            throw new Error("Invalid slippage type");
        }
        Object.assign(this, Object.assign(Object.assign({}, data), { transfer: new IbcTransferMsgValue(data.transfer), slippage, route: (_a = data.route) === null || _a === void 0 ? void 0 : _a.map((hop) => {
                return new OsmosisPoolHop(hop);
            }) }));
    }
}
__decorate([
    field({ type: IbcTransferMsgValue })
], OsmosisSwapMsgValue.prototype, "transfer", void 0);
__decorate([
    field({ type: "string" })
], OsmosisSwapMsgValue.prototype, "outputDenom", void 0);
__decorate([
    field({ type: "string" })
], OsmosisSwapMsgValue.prototype, "recipient", void 0);
__decorate([
    field({ type: "string" })
], OsmosisSwapMsgValue.prototype, "overflow", void 0);
__decorate([
    field({ type: SlippageMsgValue })
], OsmosisSwapMsgValue.prototype, "slippage", void 0);
__decorate([
    field({ type: "string" })
], OsmosisSwapMsgValue.prototype, "localRecoveryAddr", void 0);
__decorate([
    field({ type: option(vec(OsmosisPoolHop)) })
], OsmosisSwapMsgValue.prototype, "route", void 0);
__decorate([
    field({ type: "string" })
], OsmosisSwapMsgValue.prototype, "osmosisRestRpc", void 0);
