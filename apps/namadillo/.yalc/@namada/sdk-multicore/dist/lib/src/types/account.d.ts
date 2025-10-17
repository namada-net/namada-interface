export type Bip44Path = {
    account: number;
    change: number;
    index: number;
};
export type Zip32Path = {
    account: number;
    index?: number;
};
/**
 * ViewingKey with optional birthday
 */
export type DatedViewingKey = {
    key: string;
    birthday: number;
};
/**
 * Constant of SLIP-044 coin type used for Namada
 */
export declare const NAMADA_COIN_TYPE = 877;
