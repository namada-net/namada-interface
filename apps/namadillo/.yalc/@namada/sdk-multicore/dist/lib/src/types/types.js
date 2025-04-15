export var ResultCode;
(function (ResultCode) {
    ResultCode[ResultCode["Ok"] = 0] = "Ok";
    ResultCode[ResultCode["WasmRuntimeError"] = 1] = "WasmRuntimeError";
    ResultCode[ResultCode["InvalidTx"] = 2] = "InvalidTx";
    ResultCode[ResultCode["InvalidSig"] = 3] = "InvalidSig";
    ResultCode[ResultCode["AllocationError"] = 4] = "AllocationError";
    ResultCode[ResultCode["ReplayTx"] = 5] = "ReplayTx";
    ResultCode[ResultCode["InvalidChainId"] = 6] = "InvalidChainId";
    ResultCode[ResultCode["ExpiredTx"] = 7] = "ExpiredTx";
    ResultCode[ResultCode["TxGasLimit"] = 8] = "TxGasLimit";
    ResultCode[ResultCode["FeeError"] = 9] = "FeeError";
    ResultCode[ResultCode["InvalidVoteExtension"] = 10] = "InvalidVoteExtension";
    ResultCode[ResultCode["TooLarge"] = 11] = "TooLarge";
    ResultCode[ResultCode["TxNotAllowlisted"] = 12] = "TxNotAllowlisted";
})(ResultCode || (ResultCode = {}));
export const ResultCodes = {
    [ResultCode.Ok]: "",
    [ResultCode.WasmRuntimeError]: "Error in WASM tx execution",
    [ResultCode.InvalidTx]: "Invalid tx",
    [ResultCode.InvalidSig]: "Invalid signature",
    [ResultCode.AllocationError]: "The block is full",
    [ResultCode.ReplayTx]: "Replayed tx",
    [ResultCode.InvalidChainId]: "Invalid chain ID",
    [ResultCode.ExpiredTx]: "Expired tx",
    [ResultCode.TxGasLimit]: "Transaction gas required exceeds the gas limit.",
    [ResultCode.FeeError]: "Error in paying tx fee",
    [ResultCode.InvalidVoteExtension]: "Invalid vote extension",
    [ResultCode.TooLarge]: "Tx is too large",
    [ResultCode.TxNotAllowlisted]: "Tx code is not allowlisted",
};
