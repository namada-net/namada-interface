import { wasmFetch } from './snippets/sdk-2c2c481892833096/src/rpc_client.js';
import { fetchAndStoreMaspParams, getMaspParams, hasMaspParams } from './snippets/sdk-2c2c481892833096/src/sdk/mod.js';

let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_6.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_6.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function passArrayJsValueToWasm0(array, malloc) {
    const ptr = malloc(array.length * 4, 4) >>> 0;
    for (let i = 0; i < array.length; i++) {
        const add = addToExternrefTable0(array[i]);
        getDataViewMemory0().setUint32(ptr + 4 * i, add, true);
    }
    WASM_VECTOR_LEN = array.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * @param {Uint8Array} tx_bytes
 * @returns {any}
 */
export function get_inner_tx_meta(tx_bytes) {
    const ptr0 = passArray8ToWasm0(tx_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.get_inner_tx_meta(ptr0, len0);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

/**
 * @param {Uint8Array} tx_bytes
 * @param {any} wasm_hashes
 * @returns {Uint8Array}
 */
export function deserialize_tx(tx_bytes, wasm_hashes) {
    const ptr0 = passArray8ToWasm0(tx_bytes, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.deserialize_tx(ptr0, len0, wasm_hashes);
    if (ret[3]) {
        throw takeFromExternrefTable0(ret[2]);
    }
    var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
    return v2;
}

/**
 * @param {number} _threads
 * @returns {Promise<void>}
 */
export function initThreadPool(_threads) {
    const ret = wasm.initThreadPool(_threads);
    return ret;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}
/**
 * Find next payment address from current index for viewing key
 * @param {string} vk
 * @param {number} index
 * @returns {any}
 */
export function gen_payment_address(vk, index) {
    const ptr0 = passStringToWasm0(vk, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.gen_payment_address(ptr0, len0, index);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_export_2.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}
/**
 * Helper function to bech32 encode a public key from bytes
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function public_key_to_bech32(bytes) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.public_key_to_bech32(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

function __wbg_adapter_36(arg0, arg1, arg2) {
    const ret = wasm.closure1236_externref_shim_multivalue_shim(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function __wbg_adapter_39(arg0, arg1, arg2) {
    wasm.closure2165_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_42(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h034adba6fa3ac1ee(arg0, arg1);
}

function __wbg_adapter_380(arg0, arg1, arg2, arg3) {
    wasm.closure2831_externref_shim(arg0, arg1, arg2, arg3);
}

/**
 * @enum {12 | 24 | 32}
 */
export const ByteSize = Object.freeze({
    N12: 12, "12": "N12",
    N24: 24, "24": "N24",
    N32: 32, "32": "N32",
});
/**
 * @enum {1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11}
 */
export const TxType = Object.freeze({
    Bond: 1, "1": "Bond",
    Unbond: 2, "2": "Unbond",
    Withdraw: 3, "3": "Withdraw",
    Transfer: 4, "4": "Transfer",
    IBCTransfer: 5, "5": "IBCTransfer",
    EthBridgeTransfer: 6, "6": "EthBridgeTransfer",
    RevealPK: 7, "7": "RevealPK",
    VoteProposal: 8, "8": "VoteProposal",
    Redelegate: 9, "9": "Redelegate",
    Batch: 10, "10": "Batch",
    ClaimRewards: 11, "11": "ClaimRewards",
});

const __wbindgen_enum_IdbTransactionMode = ["readonly", "readwrite", "versionchange", "readwriteflush", "cleanup"];

const __wbindgen_enum_RequestCredentials = ["omit", "same-origin", "include"];

const __wbindgen_enum_RequestMode = ["same-origin", "no-cors", "cors", "navigate"];

const AESFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_aes_free(ptr >>> 0, 1));

export class AES {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AESFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_aes_free(ptr, 0);
    }
    /**
     * @param {VecU8Pointer} key
     * @param {Uint8Array} iv
     */
    constructor(key, iv) {
        _assertClass(key, VecU8Pointer);
        var ptr0 = key.__destroy_into_raw();
        const ptr1 = passArray8ToWasm0(iv, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.aes_new(ptr0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        AESFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} text
     * @returns {Uint8Array}
     */
    encrypt(text) {
        const ptr0 = passStringToWasm0(text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.aes_encrypt(this.__wbg_ptr, ptr0, len0);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v2;
    }
    /**
     * @param {Uint8Array} ciphertext
     * @returns {VecU8Pointer}
     */
    decrypt(ciphertext) {
        const ptr0 = passArray8ToWasm0(ciphertext, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.aes_decrypt(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return VecU8Pointer.__wrap(ret[0]);
    }
}

const AddressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_address_free(ptr >>> 0, 1));

export class Address {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AddressFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_address_free(ptr, 0);
    }
    /**
     * Address helpers for wasm_bindgen
     * @param {string} secret
     */
    constructor(secret) {
        const ptr0 = passStringToWasm0(secret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.address_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        AddressFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    implicit() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.address_implicit(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    public() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.address_public(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    hash() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.address_hash(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const Argon2Finalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_argon2_free(ptr >>> 0, 1));

export class Argon2 {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Argon2Finalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_argon2_free(ptr, 0);
    }
    /**
     * @param {string} password
     * @param {string | null} [salt]
     * @param {Argon2Params | null} [params]
     */
    constructor(password, salt, params) {
        const ptr0 = passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(salt) ? 0 : passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        let ptr2 = 0;
        if (!isLikeNone(params)) {
            _assertClass(params, Argon2Params);
            ptr2 = params.__destroy_into_raw();
        }
        const ret = wasm.argon2_new(ptr0, len0, ptr1, len1, ptr2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        Argon2Finalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {string}
     */
    to_hash() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.argon2_to_hash(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * @param {string} hash
     */
    verify(hash) {
        const ptr0 = passStringToWasm0(hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.argon2_verify(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @returns {Argon2Params}
     */
    params() {
        const ret = wasm.argon2_params(this.__wbg_ptr);
        return Argon2Params.__wrap(ret);
    }
    /**
     * Convert PHC string to serialized key
     * @returns {VecU8Pointer}
     */
    key() {
        const ret = wasm.argon2_key(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return VecU8Pointer.__wrap(ret[0]);
    }
}

const Argon2ParamsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_argon2params_free(ptr >>> 0, 1));

export class Argon2Params {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Argon2Params.prototype);
        obj.__wbg_ptr = ptr;
        Argon2ParamsFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Argon2ParamsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_argon2params_free(ptr, 0);
    }
    /**
     * @param {number} m_cost
     * @param {number} t_cost
     * @param {number} p_cost
     */
    constructor(m_cost, t_cost, p_cost) {
        const ret = wasm.argon2params_new(m_cost, t_cost, p_cost);
        this.__wbg_ptr = ret >>> 0;
        Argon2ParamsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    get m_cost() {
        const ret = wasm.argon2params_m_cost(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get t_cost() {
        const ret = wasm.argon2params_t_cost(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get p_cost() {
        const ret = wasm.argon2params_p_cost(this.__wbg_ptr);
        return ret >>> 0;
    }
}

const BatchTxResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_batchtxresult_free(ptr >>> 0, 1));

export class BatchTxResult {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BatchTxResultFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_batchtxresult_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    get is_applied() {
        const ret = wasm.__wbg_get_batchtxresult_is_applied(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} arg0
     */
    set is_applied(arg0) {
        wasm.__wbg_set_batchtxresult_is_applied(this.__wbg_ptr, arg0);
    }
}

const DatedViewingKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_datedviewingkey_free(ptr >>> 0, 1));

export class DatedViewingKey {

    static __unwrap(jsValue) {
        if (!(jsValue instanceof DatedViewingKey)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DatedViewingKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_datedviewingkey_free(ptr, 0);
    }
    /**
     * @param {string} key
     * @param {string} birthday
     */
    constructor(key, birthday) {
        const ptr0 = passStringToWasm0(key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(birthday, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.datedviewingkey_new(ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        DatedViewingKeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}

const DerivationResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_derivationresult_free(ptr >>> 0, 1));

export class DerivationResult {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DerivationResult.prototype);
        obj.__wbg_ptr = ptr;
        DerivationResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DerivationResultFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_derivationresult_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    xsk() {
        const ret = wasm.derivationresult_xsk(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    xfvk() {
        const ret = wasm.derivationresult_xfvk(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    payment_address() {
        const ret = wasm.derivationresult_payment_address(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}

const ExtendedSpendingKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_extendedspendingkey_free(ptr >>> 0, 1));
/**
 * Wrap ExtendedSpendingKey
 */
export class ExtendedSpendingKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ExtendedSpendingKey.prototype);
        obj.__wbg_ptr = ptr;
        ExtendedSpendingKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExtendedSpendingKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_extendedspendingkey_free(ptr, 0);
    }
    /**
     * Instantiate ExtendedSpendingKey from serialized vector
     * @param {Uint8Array} key
     */
    constructor(key) {
        const ret = wasm.extendedspendingkey_new(key);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        ExtendedSpendingKeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} xsk
     * @returns {ExtendedSpendingKey}
     */
    static from_string(xsk) {
        const ptr0 = passStringToWasm0(xsk, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.extendedspendingkey_from_string(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ExtendedSpendingKey.__wrap(ret[0]);
    }
    /**
     * @returns {ExtendedViewingKey}
     */
    to_viewing_key() {
        const ret = wasm.extendedspendingkey_to_viewing_key(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ExtendedViewingKey.__wrap(ret[0]);
    }
    /**
     * @returns {any}
     */
    to_default_address() {
        const ret = wasm.extendedspendingkey_to_default_address(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @returns {ProofGenerationKey}
     */
    to_proof_generation_key() {
        const ret = wasm.extendedspendingkey_to_proof_generation_key(this.__wbg_ptr);
        return ProofGenerationKey.__wrap(ret);
    }
    /**
     * @returns {PseudoExtendedKey}
     */
    to_pseudo_extended_key() {
        const ret = wasm.extendedspendingkey_to_pseudo_extended_key(this.__wbg_ptr);
        return PseudoExtendedKey.__wrap(ret);
    }
    /**
     * Return ExtendedSpendingKey as Bech32-encoded String
     * @returns {string}
     */
    encode() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.extendedspendingkey_encode(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const ExtendedViewingKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_extendedviewingkey_free(ptr >>> 0, 1));
/**
 * Wrap ExtendedViewingKey
 */
export class ExtendedViewingKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ExtendedViewingKey.prototype);
        obj.__wbg_ptr = ptr;
        ExtendedViewingKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ExtendedViewingKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_extendedviewingkey_free(ptr, 0);
    }
    /**
     * Instantiate ExtendedViewingKey from serialized vector
     * @param {Uint8Array} key
     */
    constructor(key) {
        const ptr0 = passArray8ToWasm0(key, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.extendedviewingkey_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        ExtendedViewingKeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Return ExtendedViewingKey as Bech32-encoded String
     * @returns {string}
     */
    encode() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.extendedviewingkey_encode(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {any}
     */
    default_payment_address() {
        const ret = wasm.extendedviewingkey_default_payment_address(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
}

const HDWalletFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hdwallet_free(ptr >>> 0, 1));

export class HDWallet {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(HDWallet.prototype);
        obj.__wbg_ptr = ptr;
        HDWalletFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HDWalletFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hdwallet_free(ptr, 0);
    }
    /**
     * @param {VecU8Pointer} seed_ptr
     */
    constructor(seed_ptr) {
        _assertClass(seed_ptr, VecU8Pointer);
        var ptr0 = seed_ptr.__destroy_into_raw();
        const ret = wasm.hdwallet_new(ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        HDWalletFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Uint8Array} seed
     * @returns {HDWallet}
     */
    static from_seed(seed) {
        const ptr0 = passArray8ToWasm0(seed, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.hdwallet_from_seed(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return HDWallet.__wrap(ret[0]);
    }
    /**
     * Derive account from a seed and a path
     * @param {Uint32Array} path
     * @returns {Key}
     */
    derive(path) {
        const ptr0 = passArray32ToWasm0(path, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.hdwallet_derive(this.__wbg_ptr, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Key.__wrap(ret[0]);
    }
    /**
     * @returns {Key}
     */
    static disposable_keypair() {
        const ret = wasm.hdwallet_disposable_keypair();
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Key.__wrap(ret[0]);
    }
}

const KeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_key_free(ptr >>> 0, 1));

export class Key {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Key.prototype);
        obj.__wbg_ptr = ptr;
        KeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        KeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_key_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} bytes
     */
    constructor(bytes) {
        const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.key_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        KeyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Uint8Array}
     */
    to_bytes() {
        const ret = wasm.key_to_bytes(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {StringPointer}
     */
    to_hex() {
        const ret = wasm.key_to_hex(this.__wbg_ptr);
        return StringPointer.__wrap(ret);
    }
}

const MnemonicFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_mnemonic_free(ptr >>> 0, 1));

export class Mnemonic {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Mnemonic.prototype);
        obj.__wbg_ptr = ptr;
        MnemonicFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MnemonicFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_mnemonic_free(ptr, 0);
    }
    /**
     * @param {number} size
     */
    constructor(size) {
        const ret = wasm.mnemonic_new(size);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        MnemonicFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} phrase
     * @returns {boolean}
     */
    static validate(phrase) {
        const ptr0 = passStringToWasm0(phrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mnemonic_validate(ptr0, len0);
        return ret !== 0;
    }
    /**
     * @param {string} phrase
     * @returns {Mnemonic}
     */
    static from_phrase(phrase) {
        const ptr0 = passStringToWasm0(phrase, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mnemonic_from_phrase(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Mnemonic.__wrap(ret[0]);
    }
    /**
     * @param {StringPointer | null} [passphrase]
     * @returns {VecU8Pointer}
     */
    to_seed(passphrase) {
        let ptr0 = 0;
        if (!isLikeNone(passphrase)) {
            _assertClass(passphrase, StringPointer);
            ptr0 = passphrase.__destroy_into_raw();
        }
        const ret = wasm.mnemonic_to_seed(this.__wbg_ptr, ptr0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return VecU8Pointer.__wrap(ret[0]);
    }
    /**
     * @returns {VecStringPointer}
     */
    to_words() {
        const ret = wasm.mnemonic_to_words(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return VecStringPointer.__wrap(ret[0]);
    }
    /**
     * @returns {string}
     */
    phrase() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.mnemonic_phrase(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const PaymentAddressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_paymentaddress_free(ptr >>> 0, 1));
/**
 * Wrap PaymentAddress
 */
export class PaymentAddress {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PaymentAddressFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_paymentaddress_free(ptr, 0);
    }
    /**
     * Instantiate PaymentAddress from serialized vector
     * @param {Uint8Array} address
     */
    constructor(address) {
        const ptr0 = passArray8ToWasm0(address, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.paymentaddress_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        PaymentAddressFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Retrieve PaymentAddress hash
     * @returns {string}
     */
    hash() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.paymentaddress_hash(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Return PaymentAddress as Bech32-encoded String
     * @returns {string}
     */
    encode() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.paymentaddress_encode(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const ProgressBarNamesFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_progressbarnames_free(ptr >>> 0, 1));

export class ProgressBarNames {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProgressBarNamesFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_progressbarnames_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    static get Scanned() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.progressbarnames_Scanned();
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    static get Fetched() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.progressbarnames_Fetched();
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    static get Applied() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.progressbarnames_Applied();
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const ProgressFinishFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_progressfinish_free(ptr >>> 0, 1));

export class ProgressFinish {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProgressFinishFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_progressfinish_free(ptr, 0);
    }
}

const ProgressIncrementFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_progressincrement_free(ptr >>> 0, 1));

export class ProgressIncrement {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProgressIncrementFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_progressincrement_free(ptr, 0);
    }
}

const ProgressStartFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_progressstart_free(ptr >>> 0, 1));

export class ProgressStart {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProgressStartFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_progressstart_free(ptr, 0);
    }
}

const ProofGenerationKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_proofgenerationkey_free(ptr >>> 0, 1));

export class ProofGenerationKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ProofGenerationKey.prototype);
        obj.__wbg_ptr = ptr;
        ProofGenerationKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProofGenerationKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_proofgenerationkey_free(ptr, 0);
    }
    /**
     * @param {Uint8Array} ak
     * @param {Uint8Array} nsk
     * @returns {ProofGenerationKey}
     */
    static from_bytes(ak, nsk) {
        const ptr0 = passArray8ToWasm0(ak, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(nsk, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.proofgenerationkey_from_bytes(ptr0, len0, ptr1, len1);
        return ProofGenerationKey.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    encode() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.proofgenerationkey_encode(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} encoded
     * @returns {ProofGenerationKey}
     */
    static decode(encoded) {
        const ptr0 = passStringToWasm0(encoded, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.proofgenerationkey_decode(ptr0, len0);
        return ProofGenerationKey.__wrap(ret);
    }
}

const PseudoExtendedKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_pseudoextendedkey_free(ptr >>> 0, 1));
/**
 * Wrap ExtendedSpendingKey
 */
export class PseudoExtendedKey {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PseudoExtendedKey.prototype);
        obj.__wbg_ptr = ptr;
        PseudoExtendedKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PseudoExtendedKeyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_pseudoextendedkey_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    encode() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.pseudoextendedkey_encode(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @param {string} encoded
     * @returns {PseudoExtendedKey}
     */
    static decode(encoded) {
        const ptr0 = passStringToWasm0(encoded, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.pseudoextendedkey_decode(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return PseudoExtendedKey.__wrap(ret[0]);
    }
    /**
     * @param {string} encoded
     * @returns {boolean}
     */
    static can_decode(encoded) {
        const ptr0 = passStringToWasm0(encoded, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.pseudoextendedkey_can_decode(ptr0, len0);
        return ret !== 0;
    }
    /**
     * @param {ExtendedViewingKey} xvk
     * @param {ProofGenerationKey} pgk
     * @returns {PseudoExtendedKey}
     */
    static from(xvk, pgk) {
        _assertClass(xvk, ExtendedViewingKey);
        var ptr0 = xvk.__destroy_into_raw();
        _assertClass(pgk, ProofGenerationKey);
        var ptr1 = pgk.__destroy_into_raw();
        const ret = wasm.pseudoextendedkey_from(ptr0, ptr1);
        return PseudoExtendedKey.__wrap(ret);
    }
    /**
     * @returns {ExtendedViewingKey}
     */
    to_viewing_key() {
        const ret = wasm.pseudoextendedkey_to_viewing_key(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ExtendedViewingKey.__wrap(ret[0]);
    }
}

const QueryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_query_free(ptr >>> 0, 1));
/**
 * Represents an API for querying the ledger
 */
export class Query {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        QueryFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_query_free(ptr, 0);
    }
    /**
     * @param {string} url
     * @param {string | null} [masp_url]
     */
    constructor(url, masp_url) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(masp_url) ? 0 : passStringToWasm0(masp_url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.query_new(ptr0, len0, ptr1, len1);
        this.__wbg_ptr = ret >>> 0;
        QueryFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Gets current epoch
     *
     * # Errors
     *
     * Returns an error if the RPC call fails
     * @returns {Promise<bigint>}
     */
    query_epoch() {
        const ret = wasm.query_query_epoch(this.__wbg_ptr);
        return ret;
    }
    /**
     * Gets all active validator addresses
     *
     * # Errors
     *
     * Returns an error if the RPC call fails
     * @returns {Promise<any>}
     */
    query_all_validator_addresses() {
        const ret = wasm.query_query_all_validator_addresses(this.__wbg_ptr);
        return ret;
    }
    /**
     * Gets total bonds by validator address
     *
     * # Errors
     *
     * Returns an error if the RPC call fails
     * @param {string} address
     * @returns {Promise<any>}
     */
    query_total_bonds(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.query_query_total_bonds(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * Gets all delegations for every provided address.
     * Returns a tuple of:
     * (owner_address, validator_address, total_bonds, total_unbonds, withdrawable)
     *
     * # Arguments
     *
     * * `owner_addresses` - Account address in form of bech32, base64 encoded string
     *
     * # Errors
     *
     * Panics if address can't be deserialized
     * @param {any[]} owner_addresses
     * @returns {Promise<any>}
     */
    query_my_validators(owner_addresses) {
        const ptr0 = passArrayJsValueToWasm0(owner_addresses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.query_query_my_validators(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {any[]} owner_addresses
     * @returns {Promise<any>}
     */
    query_staking_positions(owner_addresses) {
        const ptr0 = passArrayJsValueToWasm0(owner_addresses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.query_query_staking_positions(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {DatedViewingKey[]} vks
     * @param {string} chain_id
     * @returns {Promise<void>}
     */
    shielded_sync(vks, chain_id) {
        const ptr0 = passArrayJsValueToWasm0(vks, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.query_shielded_sync(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} owner
     * @param {any[]} tokens
     * @param {string} chain_id
     * @returns {Promise<any>}
     */
    query_balance(owner, tokens, chain_id) {
        const ptr0 = passStringToWasm0(owner, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(tokens, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.query_query_balance(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @param {string} address
     * @returns {Promise<any>}
     */
    query_public_key(address) {
        const ptr0 = passStringToWasm0(address, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.query_query_public_key(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {any[]} owner_addresses
     * @returns {Promise<any>}
     */
    query_signed_bridge_pool(owner_addresses) {
        const ptr0 = passArrayJsValueToWasm0(owner_addresses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.query_query_signed_bridge_pool(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {bigint} epoch
     * @returns {Promise<any>}
     */
    query_total_staked_tokens(epoch) {
        const ret = wasm.query_query_total_staked_tokens(this.__wbg_ptr, epoch);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    query_proposal_counter() {
        const ret = wasm.query_query_proposal_counter(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {bigint} id
     * @returns {Promise<Uint8Array>}
     */
    query_proposal_by_id(id) {
        const ret = wasm.query_query_proposal_by_id(this.__wbg_ptr, id);
        return ret;
    }
    /**
     * @param {bigint} proposal_id
     * @param {bigint} epoch
     * @returns {Promise<any>}
     */
    query_proposal_votes(proposal_id, epoch) {
        const ret = wasm.query_query_proposal_votes(this.__wbg_ptr, proposal_id, epoch);
        return ret;
    }
    /**
     * @param {bigint} proposal_id
     * @param {bigint} epoch
     * @returns {Promise<any>}
     */
    query_proposal_result(proposal_id, epoch) {
        const ret = wasm.query_query_proposal_result(this.__wbg_ptr, proposal_id, epoch);
        return ret;
    }
    /**
     * @param {bigint} proposal_id
     * @returns {Promise<Uint8Array>}
     */
    query_proposal_code(proposal_id) {
        const ret = wasm.query_query_proposal_code(this.__wbg_ptr, proposal_id);
        return ret;
    }
    /**
     * Returns a list of all delegations for given addresses and epoch
     *
     * # Arguments
     *
     * * `addresses` - delegators addresses
     * * `epoch` - epoch in which we want to query delegations
     * @param {any[]} addresses
     * @param {bigint | null} [epoch]
     * @returns {Promise<any>}
     */
    get_total_delegations(addresses, epoch) {
        const ptr0 = passArrayJsValueToWasm0(addresses, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.query_get_total_delegations(this.__wbg_ptr, ptr0, len0, !isLikeNone(epoch), isLikeNone(epoch) ? BigInt(0) : epoch);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    masp_reward_tokens() {
        const ret = wasm.query_masp_reward_tokens(this.__wbg_ptr);
        return ret;
    }
    /**
     * Returns list of delegators that already voted on a proposal
     *
     * # Arguments
     *
     * * `proposal_id` - id of proposal to get delegators votes from
     * @param {bigint} proposal_id
     * @returns {Promise<any>}
     */
    delegators_votes(proposal_id) {
        const ret = wasm.query_delegators_votes(this.__wbg_ptr, proposal_id);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    query_gas_costs() {
        const ret = wasm.query_query_gas_costs(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    query_native_token() {
        const ret = wasm.query_query_native_token(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string[]}
     */
    static code_paths() {
        const ret = wasm.query_code_paths();
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Promise<any>}
     */
    query_wasm_hashes() {
        const ret = wasm.query_query_wasm_hashes(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {string} tx_code_path
     * @returns {Promise<string | undefined>}
     */
    query_wasm_hash(tx_code_path) {
        const ptr0 = passStringToWasm0(tx_code_path, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.query_query_wasm_hash(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
}

const RngFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_rng_free(ptr >>> 0, 1));

export class Rng {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RngFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rng_free(ptr, 0);
    }
    /**
     * @param {ByteSize | null} [size]
     * @returns {Uint8Array}
     */
    static generate_bytes(size) {
        const ret = wasm.rng_generate_bytes(isLikeNone(size) ? 0 : size);
        if (ret[3]) {
            throw takeFromExternrefTable0(ret[2]);
        }
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
}

const SaltFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_salt_free(ptr >>> 0, 1));

export class Salt {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Salt.prototype);
        obj.__wbg_ptr = ptr;
        SaltFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SaltFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_salt_free(ptr, 0);
    }
    /**
     * @param {string} salt
     */
    constructor(salt) {
        const ptr0 = passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.salt_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        SaltFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Salt}
     */
    static generate() {
        const ret = wasm.salt_generate();
        return Salt.__wrap(ret);
    }
    /**
     * @returns {string}
     */
    as_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.salt_as_string(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const SdkFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sdk_free(ptr >>> 0, 1));
/**
 * Represents the Sdk public API.
 */
export class Sdk {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SdkFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sdk_free(ptr, 0);
    }
    /**
     * @param {string} url
     * @param {string} native_token
     * @param {string} path_or_db_name
     */
    constructor(url, native_token, path_or_db_name) {
        const ptr0 = passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(native_token, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(path_or_db_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_new(ptr0, len0, ptr1, len1, ptr2, len2);
        this.__wbg_ptr = ret >>> 0;
        SdkFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {string} chain_id
     * @returns {Promise<void>}
     */
    static clear_shielded_context(chain_id) {
        const ptr0 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_clear_shielded_context(ptr0, len0);
        return ret;
    }
    /**
     * @returns {Promise<any>}
     */
    static has_masp_params() {
        const ret = wasm.sdk_has_masp_params();
        return ret;
    }
    /**
     * @param {string | null} [url]
     * @returns {Promise<void>}
     */
    static fetch_and_store_masp_params(url) {
        var ptr0 = isLikeNone(url) ? 0 : passStringToWasm0(url, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_fetch_and_store_masp_params(ptr0, len0);
        return ret;
    }
    /**
     * @param {any} _db_name
     * @param {string} chain_id
     * @returns {Promise<void>}
     */
    load_masp_params(_db_name, chain_id) {
        const ptr0 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_load_masp_params(this.__wbg_ptr, _db_name, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} xsk
     * @param {string} alias
     * @returns {Promise<void>}
     */
    add_spending_key(xsk, alias) {
        const ptr0 = passStringToWasm0(xsk, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(alias, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_add_spending_key(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} xvk
     * @param {string} alias
     * @returns {Promise<void>}
     */
    add_viewing_key(xvk, alias) {
        const ptr0 = passStringToWasm0(xvk, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(alias, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_add_viewing_key(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} pa
     * @param {string} alias
     * @returns {Promise<void>}
     */
    add_payment_address(pa, alias) {
        const ptr0 = passStringToWasm0(pa, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(alias, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_add_payment_address(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} xvk
     * @param {string} alias
     * @returns {Promise<void>}
     */
    add_default_payment_address(xvk, alias) {
        const ptr0 = passStringToWasm0(xvk, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(alias, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_add_default_payment_address(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} secret_key
     * @param {string} alias
     * @param {string | null} [password]
     * @returns {Promise<void>}
     */
    add_keypair(secret_key, alias, password) {
        const ptr0 = passStringToWasm0(secret_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(alias, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(password) ? 0 : passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len2 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_add_keypair(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */
    save_wallet() {
        const ret = wasm.sdk_save_wallet(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Promise<void>}
     */
    load_wallet() {
        const ret = wasm.sdk_load_wallet(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {string[]} xsks
     * @param {Uint8Array} tx
     * @returns {Promise<any>}
     */
    sign_masp(xsks, tx) {
        const ptr0 = passArrayJsValueToWasm0(xsks, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(tx, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_sign_masp(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} tx
     * @param {Uint8Array} shielded_hash
     * @returns {any}
     */
    get_descriptor_map(tx, shielded_hash) {
        const ptr0 = passArray8ToWasm0(tx, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(shielded_hash, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_get_descriptor_map(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Uint8Array} tx
     * @param {Uint8Array[]} signing_data
     * @param {Uint8Array[]} signatures
     * @returns {any}
     */
    sign_masp_ledger(tx, signing_data, signatures) {
        const ptr0 = passArray8ToWasm0(tx, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(signing_data, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayJsValueToWasm0(signatures, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_sign_masp_ledger(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Uint8Array} tx
     * @param {string[]} private_keys
     * @param {string | null} [chain_id]
     * @returns {Promise<any>}
     */
    sign_tx(tx, private_keys, chain_id) {
        const ptr0 = passArray8ToWasm0(tx, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayJsValueToWasm0(private_keys, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(chain_id) ? 0 : passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len2 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_sign_tx(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @param {Uint8Array} tx_bytes
     * @param {bigint} deadline
     * @returns {Promise<any>}
     */
    broadcast_tx(tx_bytes, deadline) {
        const ptr0 = passArray8ToWasm0(tx_bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_broadcast_tx(this.__wbg_ptr, ptr0, len0, deadline);
        return ret;
    }
    /**
     * Build a batch Tx from built transactions and return the bytes
     * @param {any} txs
     * @returns {any}
     */
    static build_batch(txs) {
        const ret = wasm.sdk_build_batch(txs);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Uint8Array} tx_bytes
     * @param {Uint8Array} sig_msg_bytes
     * @returns {any}
     */
    append_signature(tx_bytes, sig_msg_bytes) {
        const ptr0 = passArray8ToWasm0(tx_bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(sig_msg_bytes, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_append_signature(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {Uint8Array} transfer_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_transparent_transfer(transfer_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(transfer_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_transparent_transfer(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} shielded_transfer_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @param {boolean} skip_fee_check
     * @returns {Promise<any>}
     */
    build_shielded_transfer(shielded_transfer_msg, wrapper_tx_msg, skip_fee_check) {
        const ptr0 = passArray8ToWasm0(shielded_transfer_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_shielded_transfer(this.__wbg_ptr, ptr0, len0, ptr1, len1, skip_fee_check);
        return ret;
    }
    /**
     * @param {Uint8Array} unshielding_transfer_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @param {boolean} skip_fee_check
     * @returns {Promise<any>}
     */
    build_unshielding_transfer(unshielding_transfer_msg, wrapper_tx_msg, skip_fee_check) {
        const ptr0 = passArray8ToWasm0(unshielding_transfer_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_unshielding_transfer(this.__wbg_ptr, ptr0, len0, ptr1, len1, skip_fee_check);
        return ret;
    }
    /**
     * @param {Uint8Array} shielding_transfer_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_shielding_transfer(shielding_transfer_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(shielding_transfer_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_shielding_transfer(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} ibc_transfer_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_ibc_transfer(ibc_transfer_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(ibc_transfer_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_ibc_transfer(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} eth_bridge_transfer_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_eth_bridge_transfer(eth_bridge_transfer_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(eth_bridge_transfer_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_eth_bridge_transfer(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} vote_proposal_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_vote_proposal(vote_proposal_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(vote_proposal_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_vote_proposal(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} claim_rewards_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_claim_rewards(claim_rewards_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(claim_rewards_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_claim_rewards(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} bond_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_bond(bond_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(bond_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_bond(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} unbond_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_unbond(unbond_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(unbond_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_unbond(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} withdraw_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_withdraw(withdraw_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(withdraw_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_withdraw(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} redelegate_msg
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_redelegate(redelegate_msg, wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(redelegate_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_redelegate(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {Uint8Array} wrapper_tx_msg
     * @returns {Promise<any>}
     */
    build_reveal_pk(wrapper_tx_msg) {
        const ptr0 = passArray8ToWasm0(wrapper_tx_msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_build_reveal_pk(this.__wbg_ptr, ptr0, len0);
        return ret;
    }
    /**
     * @param {string} signing_key
     * @param {string} data
     * @returns {any}
     */
    sign_arbitrary(signing_key, data) {
        const ptr0 = passStringToWasm0(signing_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_sign_arbitrary(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * @param {string} public_key
     * @param {string} signed_hash
     * @param {string} signature
     */
    verify_arbitrary(public_key, signed_hash, signature) {
        const ptr0 = passStringToWasm0(public_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(signed_hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(signature, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_verify_arbitrary(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {string} target
     * @param {string} token
     * @param {string} amount
     * @param {string} channel_id
     * @returns {Promise<any>}
     */
    generate_ibc_shielding_memo(target, token, amount, channel_id) {
        const ptr0 = passStringToWasm0(target, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(token, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(amount, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(channel_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_generate_ibc_shielding_memo(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        return ret;
    }
    /**
     * @param {string} owner
     * @param {string} chain_id
     * @returns {Promise<any>}
     */
    shielded_rewards(owner, chain_id) {
        const ptr0 = passStringToWasm0(owner, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_shielded_rewards(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} owner
     * @param {string} token
     * @param {string} chain_id
     * @returns {Promise<any>}
     */
    shielded_rewards_per_token(owner, token, chain_id) {
        const ptr0 = passStringToWasm0(owner, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(token, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_shielded_rewards_per_token(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @param {string} chain_id
     * @param {string} token
     * @param {string} amount
     * @returns {Promise<any>}
     */
    simulate_shielded_rewards(chain_id, token, amount) {
        const ptr0 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(token, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(amount, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_simulate_shielded_rewards(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2);
        return ret;
    }
    /**
     * @param {Uint8Array} msg
     * @param {string} chain_id
     * @returns {Promise<any>}
     */
    estimate_max_masp_tx_amount(msg, chain_id) {
        const ptr0 = passArray8ToWasm0(msg, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_estimate_max_masp_tx_amount(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @param {string} owner
     * @param {string} chain_id
     * @returns {Promise<any>}
     */
    query_notes_to_spend(owner, chain_id) {
        const ptr0 = passStringToWasm0(owner, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(chain_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.sdk_query_notes_to_spend(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return ret;
    }
    /**
     * @returns {string}
     */
    masp_address() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.sdk_masp_address(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const SdkEventsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_sdkevents_free(ptr >>> 0, 1));

export class SdkEvents {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SdkEventsFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_sdkevents_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    static get ProgressBarStarted() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.sdkevents_ProgressBarStarted();
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    static get ProgressBarIncremented() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.sdkevents_ProgressBarIncremented();
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    static get ProgressBarFinished() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.sdkevents_ProgressBarFinished();
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const ShieldedHDWalletFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_shieldedhdwallet_free(ptr >>> 0, 1));

export class ShieldedHDWallet {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ShieldedHDWallet.prototype);
        obj.__wbg_ptr = ptr;
        ShieldedHDWalletFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ShieldedHDWalletFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_shieldedhdwallet_free(ptr, 0);
    }
    /**
     * @param {any} seed
     * @param {Uint32Array} path
     */
    constructor(seed, path) {
        const ptr0 = passArray32ToWasm0(path, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.shieldedhdwallet_new(seed, ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0] >>> 0;
        ShieldedHDWalletFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {Uint8Array} sk_bytes
     * @returns {ShieldedHDWallet}
     */
    static new_from_sk(sk_bytes) {
        const ptr0 = passArray8ToWasm0(sk_bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.shieldedhdwallet_new_from_sk(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ShieldedHDWallet.__wrap(ret[0]);
    }
    /**
     * @param {Uint32Array} path
     * @param {Uint8Array | null} [diversifier]
     * @returns {DerivationResult}
     */
    derive(path, diversifier) {
        const ptr0 = passArray32ToWasm0(path, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(diversifier) ? 0 : passArray8ToWasm0(diversifier, wasm.__wbindgen_malloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.shieldedhdwallet_derive(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return DerivationResult.__wrap(ret[0]);
    }
}

const StringPointerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_stringpointer_free(ptr >>> 0, 1));

export class StringPointer {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(StringPointer.prototype);
        obj.__wbg_ptr = ptr;
        StringPointerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        StringPointerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_stringpointer_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get pointer() {
        const ret = wasm.__wbg_get_stringpointer_pointer(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set pointer(arg0) {
        wasm.__wbg_set_stringpointer_pointer(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get length() {
        const ret = wasm.__wbg_get_stringpointer_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set length(arg0) {
        wasm.__wbg_set_stringpointer_length(this.__wbg_ptr, arg0);
    }
    /**
     * @param {string} string
     */
    constructor(string) {
        const ptr0 = passStringToWasm0(string, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.stringpointer_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        StringPointerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}

const TxResponseFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_txresponse_free(ptr >>> 0, 1));
/**
 * Serializable response for process_tx calls
 */
export class TxResponse {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TxResponseFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_txresponse_free(ptr, 0);
    }
}

const VecStringPointerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vecstringpointer_free(ptr >>> 0, 1));

export class VecStringPointer {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(VecStringPointer.prototype);
        obj.__wbg_ptr = ptr;
        VecStringPointerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VecStringPointerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vecstringpointer_free(ptr, 0);
    }
    /**
     * @returns {Uint32Array}
     */
    get pointers() {
        const ret = wasm.vecstringpointer_pointers(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {Uint32Array}
     */
    get lengths() {
        const ret = wasm.vecstringpointer_lengths(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
}

const VecU8PointerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_vecu8pointer_free(ptr >>> 0, 1));

export class VecU8Pointer {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(VecU8Pointer.prototype);
        obj.__wbg_ptr = ptr;
        VecU8PointerFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        VecU8PointerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_vecu8pointer_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get pointer() {
        const ret = wasm.__wbg_get_stringpointer_pointer(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set pointer(arg0) {
        wasm.__wbg_set_stringpointer_pointer(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get length() {
        const ret = wasm.__wbg_get_stringpointer_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set length(arg0) {
        wasm.__wbg_set_stringpointer_length(this.__wbg_ptr, arg0);
    }
    /**
     * @param {Uint8Array} vec
     */
    constructor(vec) {
        const ptr0 = passArray8ToWasm0(vec, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.vecu8pointer_new(ptr0, len0);
        this.__wbg_ptr = ret >>> 0;
        VecU8PointerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_abort_775ef1d17fc65868 = function(arg0) {
        arg0.abort();
    };
    imports.wbg.__wbg_append_8c7dd8d641a5f01b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_arrayBuffer_d1b44c4390db422f = function() { return handleError(function (arg0) {
        const ret = arg0.arrayBuffer();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_buffer_609cc3eee51ed158 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_contains_b952b06daf857803 = function(arg0, arg1, arg2) {
        const ret = arg0.contains(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_createIndex_873ac48adc772309 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.createIndex(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createObjectStore_d2f9e1016f4d81b9 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.createObjectStore(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_crypto_ed58b8e10a292839 = function(arg0) {
        const ret = arg0.crypto;
        return ret;
    };
    imports.wbg.__wbg_datedviewingkey_unwrap = function(arg0) {
        const ret = DatedViewingKey.__unwrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_deleteIndex_e6717aa0e9691894 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.deleteIndex(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_deleteObjectStore_3f08ae00cd288224 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.deleteObjectStore(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_delete_200677093b4cf756 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_dispatchEvent_9e259d7c1d603dfb = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.dispatchEvent(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_done_769e5ede4b31c67b = function(arg0) {
        const ret = arg0.done;
        return ret;
    };
    imports.wbg.__wbg_error_524f506f44df1645 = function(arg0) {
        console.error(arg0);
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_error_ff4ddaabdfc5dbb3 = function() { return handleError(function (arg0) {
        const ret = arg0.error;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_fetchAndStoreMaspParams_2d79535b2f9d226e = function() { return handleError(function (arg0, arg1) {
        let v0;
        if (arg0 !== 0) {
            v0 = getStringFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 1, 1);
        }
        const ret = fetchAndStoreMaspParams(v0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fetch_4465c2b10f21a927 = function(arg0) {
        const ret = fetch(arg0);
        return ret;
    };
    imports.wbg.__wbg_fetch_509096533071c657 = function(arg0, arg1) {
        const ret = arg0.fetch(arg1);
        return ret;
    };
    imports.wbg.__wbg_getMaspParams_d1818c2f3a756cd9 = function() { return handleError(function () {
        const ret = getMaspParams();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_3c9c0d586e575a16 = function() { return handleError(function (arg0, arg1) {
        globalThis.crypto.getRandomValues(getArrayU8FromWasm0(arg0, arg1));
    }, arguments) };
    imports.wbg.__wbg_getRandomValues_bcb4912f16000dc4 = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_getTime_46267b1c24877e30 = function(arg0) {
        const ret = arg0.getTime();
        return ret;
    };
    imports.wbg.__wbg_get_4f73335ab78445db = function(arg0, arg1, arg2) {
        const ret = arg1[arg2 >>> 0];
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_67b2ba62fc30de12 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_8da03f81f6a1111e = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.get(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_hasMaspParams_4f212144100989c9 = function() { return handleError(function () {
        const ret = hasMaspParams();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_has_a5ea9117f258a0ec = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.has(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_headers_9cb51cfd2ac780a4 = function(arg0) {
        const ret = arg0.headers;
        return ret;
    };
    imports.wbg.__wbg_indexNames_0ed82a19d7d88aa3 = function(arg0) {
        const ret = arg0.indexNames;
        return ret;
    };
    imports.wbg.__wbg_info_3daf2e093e091b66 = function(arg0) {
        console.info(arg0);
    };
    imports.wbg.__wbg_instanceof_IdbFactory_12eaba3366f4302f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof IDBFactory;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Response_f2cc20d9f7dfd644 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Response;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_def73ea0955fc569 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_iterator_9a24c88df860dc65 = function() {
        const ret = Symbol.iterator;
        return ret;
    };
    imports.wbg.__wbg_json_1671bfa3e3625686 = function() { return handleError(function (arg0) {
        const ret = arg0.json();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_length_52b6c4580c5ec934 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_a446193dc22c12f8 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_log_c222819a41e063d3 = function(arg0) {
        console.log(arg0);
    };
    imports.wbg.__wbg_msCrypto_0a36e2ec3a343d26 = function(arg0) {
        const ret = arg0.msCrypto;
        return ret;
    };
    imports.wbg.__wbg_new0_f788a2397c7ca929 = function() {
        const ret = new Date();
        return ret;
    };
    imports.wbg.__wbg_new_018dcc2d6c8c2f6a = function() { return handleError(function () {
        const ret = new Headers();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_23a2665fac83c611 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_380(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            const ret = new Promise(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_new_405e22f390576ce2 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_78feb108b6472713 = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_new_a12002a7f91c75be = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_e25e5aab09ff45db = function() { return handleError(function () {
        const ret = new AbortController();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newnoargs_105ed471475aaf50 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwitheventinitdict_fae2ef218b85b0d2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new CustomEvent(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithlength_a381634e90c276d4 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithstrandinit_06c535e0a867c635 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_next_25feadfc0913fea9 = function(arg0) {
        const ret = arg0.next;
        return ret;
    };
    imports.wbg.__wbg_next_6574e1a8a62d1055 = function() { return handleError(function (arg0) {
        const ret = arg0.next();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_node_02999533c4ea02e3 = function(arg0) {
        const ret = arg0.node;
        return ret;
    };
    imports.wbg.__wbg_now_fb0466b5460cff09 = function(arg0) {
        const ret = arg0.now();
        return ret;
    };
    imports.wbg.__wbg_objectStoreNames_9bb1ab04a7012aaf = function(arg0) {
        const ret = arg0.objectStoreNames;
        return ret;
    };
    imports.wbg.__wbg_objectStore_21878d46d25b64b6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.objectStore(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_open_88b1390d99a7c691 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.open(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_open_e0c0b2993eb596e1 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.open(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_parse_def2e24ef1252aff = function() { return handleError(function (arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_performance_71b063e177862740 = function(arg0) {
        const ret = arg0.performance;
        return ret;
    };
    imports.wbg.__wbg_process_5c1d670bc53614b8 = function(arg0) {
        const ret = arg0.process;
        return ret;
    };
    imports.wbg.__wbg_push_737cfc8c1432c2c6 = function(arg0, arg1) {
        const ret = arg0.push(arg1);
        return ret;
    };
    imports.wbg.__wbg_put_066faa31a6a88f5b = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.put(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_put_9ef5363941008835 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.put(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_queueMicrotask_97d92b4fcc8a61c5 = function(arg0) {
        queueMicrotask(arg0);
    };
    imports.wbg.__wbg_queueMicrotask_d3219def82552485 = function(arg0) {
        const ret = arg0.queueMicrotask;
        return ret;
    };
    imports.wbg.__wbg_randomFillSync_ab2cfe79ebbf2740 = function() { return handleError(function (arg0, arg1) {
        arg0.randomFillSync(arg1);
    }, arguments) };
    imports.wbg.__wbg_require_79b1e9274cde3c87 = function() { return handleError(function () {
        const ret = module.require;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_resolve_4851785c9c5f573d = function(arg0) {
        const ret = Promise.resolve(arg0);
        return ret;
    };
    imports.wbg.__wbg_result_f29afabdf2c05826 = function() { return handleError(function (arg0) {
        const ret = arg0.result;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_25eabdb2fc442ea2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_f2fe5af8e3debeb3 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_65595bdd868b3009 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_setautoincrement_8b4327709e9ee7d9 = function(arg0, arg1) {
        arg0.autoIncrement = arg1 !== 0;
    };
    imports.wbg.__wbg_setbody_5923b78a95eedf29 = function(arg0, arg1) {
        arg0.body = arg1;
    };
    imports.wbg.__wbg_setcredentials_c3a22f1cd105a2c6 = function(arg0, arg1) {
        arg0.credentials = __wbindgen_enum_RequestCredentials[arg1];
    };
    imports.wbg.__wbg_setdetail_fc5160ccbec4ee24 = function(arg0, arg1) {
        arg0.detail = arg1;
    };
    imports.wbg.__wbg_setheaders_834c0bdb6a8949ad = function(arg0, arg1) {
        arg0.headers = arg1;
    };
    imports.wbg.__wbg_setkeypath_691179e313c26ae1 = function(arg0, arg1) {
        arg0.keyPath = arg1;
    };
    imports.wbg.__wbg_setmethod_3c5280fe5d890842 = function(arg0, arg1, arg2) {
        arg0.method = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setmode_5dc300b865044b65 = function(arg0, arg1) {
        arg0.mode = __wbindgen_enum_RequestMode[arg1];
    };
    imports.wbg.__wbg_setmultientry_4c4eee871f29837a = function(arg0, arg1) {
        arg0.multiEntry = arg1 !== 0;
    };
    imports.wbg.__wbg_setonerror_d7e3056cc6e56085 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonsuccess_afa464ee777a396d = function(arg0, arg1) {
        arg0.onsuccess = arg1;
    };
    imports.wbg.__wbg_setonupgradeneeded_fcf7ce4f2eb0cb5f = function(arg0, arg1) {
        arg0.onupgradeneeded = arg1;
    };
    imports.wbg.__wbg_setsignal_75b21ef3a81de905 = function(arg0, arg1) {
        arg0.signal = arg1;
    };
    imports.wbg.__wbg_setunique_dd24c422aa05df89 = function(arg0, arg1) {
        arg0.unique = arg1 !== 0;
    };
    imports.wbg.__wbg_signal_aaf9ad74119f20a4 = function(arg0) {
        const ret = arg0.signal;
        return ret;
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_status_f6360336ca686bf0 = function(arg0) {
        const ret = arg0.status;
        return ret;
    };
    imports.wbg.__wbg_stringify_f7ed6987935b4a24 = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_subarray_aa9065fa9dc5df96 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_target_0a62d9d79a2a1ede = function(arg0) {
        const ret = arg0.target;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_then_44b73946d2fb3e7d = function(arg0, arg1) {
        const ret = arg0.then(arg1);
        return ret;
    };
    imports.wbg.__wbg_then_48b406749878a531 = function(arg0, arg1, arg2) {
        const ret = arg0.then(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_toString_c813bbd34d063839 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_transaction_d6d07c3c9963c49e = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.transaction(arg1, __wbindgen_enum_IdbTransactionMode[arg2]);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_transaction_e713aa7b07ccaedd = function(arg0) {
        const ret = arg0.transaction;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_url_ae10c34ca209681d = function(arg0, arg1) {
        const ret = arg1.url;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_value_cd1ffa7b1ab794f1 = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbg_versions_c71aa1626a93e0a1 = function(arg0) {
        const ret = arg0.versions;
        return ret;
    };
    imports.wbg.__wbg_wasmFetch_9a978d72575f573c = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = wasmFetch(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_bigint_from_u64 = function(arg0) {
        const ret = BigInt.asUintN(64, arg0);
        return ret;
    };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = arg0;
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        return ret;
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = arg0.original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper10623 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 2701, __wbg_adapter_42);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper5174 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 1237, __wbg_adapter_36);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper8378 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 2166, __wbg_adapter_39);
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(arg0) === 'string';
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_uint8_array_new = function(arg0, arg1) {
        var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1, 1);
        const ret = v0;
        return ret;
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }


    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
