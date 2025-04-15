import BigNumber from "bignumber.js";
export const BigNumberSerializer = {
    serialize: (value, writer) => {
        writer.string(value.toString());
    },
    deserialize: (reader) => {
        const valueString = reader.string();
        return new BigNumber(valueString);
    },
};
