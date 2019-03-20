import { BigInteger } from "../bigInteger";
import { hexToBytes, convertUint8ArrayToHexString } from "../libs";

export class HexNumber {
    static readonly hexNumberToNumber = (hexNumber: string) :number => {
        return Number(new BigInteger(hexToBytes(hexNumber)).toString());
    }

    static readonly numberToHexNumber = (num: number): string => {
        return convertUint8ArrayToHexString(new BigInteger(num).toUint8Array());
    }
}