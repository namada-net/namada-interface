export const Argon2Config = {
    // Number of memory blocks in kibibytes
    // Max: 268_435_455
    // Min: 8
    // https://www.rfc-editor.org/rfc/rfc9106.html#name-recommendations
    m_cost: 65536, // 65536 KiB equals 64MiB
    // Number of iterations (time)
    // Max: 4_294_967_29
    // Min: 1
    t_cost: 3,
    // Number of threads (degree of parallelism)
    // Max: 16_777_215
    // Min: 1
    p_cost: 1,
};
export var KdfType;
(function (KdfType) {
    KdfType["Argon2"] = "argon2";
    KdfType["Scrypt"] = "scrypt";
})(KdfType || (KdfType = {}));
