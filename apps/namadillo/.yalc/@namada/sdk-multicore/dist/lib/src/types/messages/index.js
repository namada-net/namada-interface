import { deserialize, serialize } from "@dao-xyz/borsh";
export class Message {
    encode(value) {
        try {
            return serialize(value);
        }
        catch (e) {
            console.log("error", e);
            throw new Error(`Unable to serialize message: ${e}`);
        }
    }
    static decode(buffer, parser) {
        try {
            return deserialize(Buffer.from(buffer), parser);
        }
        catch (e) {
            throw new Error(`Unable to deserialize message: ${e}`);
        }
    }
}
