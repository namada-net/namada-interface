var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
var PREFIX = "Namada::SDK";
var MASP_MPC_RELEASE_URL = "https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/";
var sha256Hash = function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var hashBuffer, hashArray;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, crypto.subtle.digest("SHA-256", msg)];
            case 1:
                hashBuffer = _a.sent();
                hashArray = Array.from(new Uint8Array(hashBuffer));
                // Return hash as hex
                return [2 /*return*/, hashArray.map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("")];
        }
    });
}); };
var MaspParam;
(function (MaspParam) {
    MaspParam["Output"] = "masp-output.params";
    MaspParam["Convert"] = "masp-convert.params";
    MaspParam["Spend"] = "masp-spend.params";
})(MaspParam || (MaspParam = {}));
/**
 * The following sha256 digests where produced by downloading the following:
 * https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/masp-convert.params
 * https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/masp-spend.params
 * https://github.com/anoma/masp-mpc/releases/download/namada-trusted-setup/masp-output.params
 *
 * And running "sha256sum" against each file:
 *
 * > sha256sum masp-convert.params
 * 8e049c905e0e46f27662c7577a4e3480c0047ee1171f7f6d9c5b0de757bf71f1  masp-convert.params
 *
 * > sha256sum masp-spend.params
 * 62b3c60ca54bd99eb390198e949660624612f7db7942db84595fa9f1b4a29fd8  masp-spend.params
 *
 * > sha256sum masp-output.params
 * ed8b5d354017d808cfaf7b31eca5c511936e65ef6d276770251f5234ec5328b8  masp-output.params
 *
 * Length is specified in bytes, and can be retrieved with:
 *
 * > wc -c < masp-convert.params
 * 22570940
 * > wc -c < masp-spend.params
 * 49848572
 * > wc -c < masp-output.params
 * 16398620
 */
var MASP_PARAM_ATTR = (_a = {},
    _a[MaspParam.Output] = {
        length: 16398620,
        sha256sum: "ed8b5d354017d808cfaf7b31eca5c511936e65ef6d276770251f5234ec5328b8",
    },
    _a[MaspParam.Spend] = {
        length: 49848572,
        sha256sum: "62b3c60ca54bd99eb390198e949660624612f7db7942db84595fa9f1b4a29fd8",
    },
    _a[MaspParam.Convert] = {
        length: 22570940,
        sha256sum: "8e049c905e0e46f27662c7577a4e3480c0047ee1171f7f6d9c5b0de757bf71f1",
    },
    _a);
var validateMaspParamBytes = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var _c, length, sha256sum, hash;
    var param = _b.param, bytes = _b.bytes;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _c = MASP_PARAM_ATTR[param], length = _c.length, sha256sum = _c.sha256sum;
                // Reject if invalid length (incomplete download or invalid)
                console.info("Validating data length for ".concat(param, ", expecting ").concat(length, "..."));
                if (length !== bytes.length) {
                    return [2 /*return*/, Promise.reject("[".concat(param, "]: Invalid data length! Expected ").concat(length, ", received ").concat(bytes.length, "!"))];
                }
                // Reject if invalid hash (otherwise invalid data)
                console.info("Validating sha256sum for ".concat(param, ", expecting ").concat(sha256sum, "..."));
                return [4 /*yield*/, sha256Hash(bytes)];
            case 1:
                hash = _d.sent();
                if (hash !== sha256sum) {
                    return [2 /*return*/, Promise.reject("[".concat(param, "]: Invalid sha256sum! Expected ").concat(sha256sum, ", received ").concat(hash, "!"))];
                }
                return [2 /*return*/, bytes];
        }
    });
}); };
export function hasMaspParams() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, has(MaspParam.Spend)];
                case 1:
                    _b = (_c.sent());
                    if (!_b) return [3 /*break*/, 3];
                    return [4 /*yield*/, has(MaspParam.Output)];
                case 2:
                    _b = (_c.sent());
                    _c.label = 3;
                case 3:
                    _a = _b;
                    if (!_a) return [3 /*break*/, 5];
                    return [4 /*yield*/, has(MaspParam.Convert)];
                case 4:
                    _a = (_c.sent());
                    _c.label = 5;
                case 5: return [2 /*return*/, (_a)];
            }
        });
    });
}
export function fetchAndStoreMaspParams(url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.all([
                    fetchAndStore(MaspParam.Spend, url),
                    fetchAndStore(MaspParam.Output, url),
                    fetchAndStore(MaspParam.Convert, url),
                ])];
        });
    });
}
export function getMaspParams() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Promise.all([
                    get(MaspParam.Spend),
                    get(MaspParam.Output),
                    get(MaspParam.Convert),
                ])];
        });
    });
}
export function fetchAndStore(param, url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchParams(param, url)
                        .then(function (data) { return set(param, data); })
                        .catch(function (e) {
                        return Promise.reject("Encountered errors fetching ".concat(param, ": ").concat(e));
                    })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function fetchParams(param_1) {
    return __awaiter(this, arguments, void 0, function (param, url) {
        if (url === void 0) { url = MASP_MPC_RELEASE_URL; }
        return __generator(this, function (_a) {
            return [2 /*return*/, fetch("".concat(url).concat(param))
                    .then(function (response) { return response.arrayBuffer(); })
                    .then(function (ab) {
                    var bytes = new Uint8Array(ab);
                    return validateMaspParamBytes({ param: param, bytes: bytes });
                })];
        });
    });
}
function getDB() {
    return new Promise(function (resolve, reject) {
        var request = indexedDB.open(PREFIX);
        request.onerror = function (event) {
            event.stopPropagation();
            reject(event.target);
        };
        request.onupgradeneeded = function (event) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            var db = event.target.result;
            db.createObjectStore(PREFIX, { keyPath: "key" });
        };
        request.onsuccess = function () {
            resolve(request.result);
        };
    });
}
export function get(key) {
    return __awaiter(this, void 0, void 0, function () {
        var tx, store;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDB()];
                case 1:
                    tx = (_a.sent()).transaction(PREFIX, "readonly");
                    store = tx.objectStore(PREFIX);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var request = store.get(key);
                            request.onerror = function (event) {
                                event.stopPropagation();
                                reject(event.target);
                            };
                            request.onsuccess = function () {
                                if (!request.result) {
                                    resolve(undefined);
                                }
                                else {
                                    resolve(request.result.data);
                                }
                            };
                        })];
            }
        });
    });
}
export function has(key) {
    return __awaiter(this, void 0, void 0, function () {
        var tx, store;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDB()];
                case 1:
                    tx = (_a.sent()).transaction(PREFIX, "readonly");
                    store = tx.objectStore(PREFIX);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var request = store.openCursor(key);
                            request.onerror = function (event) {
                                event.stopPropagation();
                                reject(event.target);
                            };
                            request.onsuccess = function (e) {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                var cursor = e.target.result;
                                resolve(!!cursor);
                            };
                        })];
            }
        });
    });
}
export function set(key, data) {
    return __awaiter(this, void 0, void 0, function () {
        var tx, store;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDB()];
                case 1:
                    tx = (_a.sent()).transaction(PREFIX, "readwrite");
                    store = tx.objectStore(PREFIX);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var request = store.put({
                                key: key,
                                data: data,
                            });
                            request.onerror = function (event) {
                                event.stopPropagation();
                                reject(event.target);
                            };
                            request.onsuccess = function () {
                                resolve();
                            };
                        })];
            }
        });
    });
}
