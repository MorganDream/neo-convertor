import { BigInteger } from "../bigInteger";

export class Base58 {
    static readonly Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    static readonly decode = (input: string ): Uint8Array => {
        let bi: BigInteger = BigInteger.Zero;
        for (let i = input.length - 1; i >= 0; i--) {
            let index = Base58.Alphabet.indexOf(input[i]);
            if (index == -1)
                throw new RangeError();
            bi = BigInteger.add(bi, BigInteger.multiply(BigInteger.pow(Base58.Alphabet.length, input.length - 1 - i), index));
        }
        let bytes = bi.toUint8Array();
        let leadingZeros = 0;
        for (let i = 0; i < input.length && input[i] == Base58.Alphabet[0]; i++) {
            leadingZeros++;
        }
        let tmp = new Uint8Array(bytes.length + leadingZeros);
        for (let i = 0; i < bytes.length; i++)
            tmp[i + leadingZeros] = bytes[bytes.length - 1 - i];
        return tmp;
    }

    static readonly encode = (input: Uint8Array): string => {
        var value = BigInteger.fromUint8Array(input, 1, false);
        var s = "";
        while (!value.isZero()) {
            var r = BigInteger.divRem(value, Base58.Alphabet.length);
            s = Base58.Alphabet[r.remainder.toInt32()] + s;
            value = r.result;
        }
        for (var i = 0; i < input.length; i++) {
            if (input[i] == 0)
                s = Base58.Alphabet[0] + s;
            else
                break;
        }
        return s;
    }
}