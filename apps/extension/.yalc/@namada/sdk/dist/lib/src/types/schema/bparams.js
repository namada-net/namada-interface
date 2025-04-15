var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* eslint-disable @typescript-eslint/no-unused-vars */
import { field, vec } from "@dao-xyz/borsh";
export class BparamsSpendMsgValue {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: vec("u8") })
], BparamsSpendMsgValue.prototype, "rcv", void 0);
__decorate([
    field({ type: vec("u8") })
], BparamsSpendMsgValue.prototype, "alpha", void 0);
export class BparamsOutputMsgValue {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: vec("u8") })
], BparamsOutputMsgValue.prototype, "rcv", void 0);
__decorate([
    field({ type: vec("u8") })
], BparamsOutputMsgValue.prototype, "rcm", void 0);
export class BparamsConvertMsgValue {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: vec("u8") })
], BparamsConvertMsgValue.prototype, "rcv", void 0);
export class BparamsMsgValue {
    constructor(data) {
        Object.assign(this, data);
    }
}
__decorate([
    field({ type: BparamsSpendMsgValue })
], BparamsMsgValue.prototype, "spend", void 0);
__decorate([
    field({ type: BparamsOutputMsgValue })
], BparamsMsgValue.prototype, "output", void 0);
__decorate([
    field({ type: BparamsConvertMsgValue })
], BparamsMsgValue.prototype, "convert", void 0);
