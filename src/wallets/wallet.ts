import { copyArray } from "../libs";
import { Uint160 } from "../uint";
import { Subtle, Base58 } from "../crypto";

export class Wallet {
    static readonly CoinVersion = 0x17;

    static readonly toAddress = async (scriptHash: Uint160): Promise<string> => {
        let data = new Uint8Array(25);
        data[0] = Wallet.CoinVersion;
        copyArray(new Uint8Array(scriptHash.bits.buffer), 0, data, 1, 20);
        const result = await Subtle.digest("SHA-256", new Uint8Array(data.buffer, 0, 21));
        const finalResult = await Subtle.digest("SHA-256", result);
        copyArray(new Uint8Array(finalResult), 0, data, 21, 4);
        return Base58.encode(data);
    }

    static toScriptHash = async (address: string): Promise<Uint160> => {
        let data = Base58.decode(address);
        if (data.length != 25)
            throw new RangeError();
        if (data[0] != Wallet.CoinVersion)
            throw new RangeError();
        const result = await Subtle.digest("SHA-256", new Uint8Array(data.buffer, 0, data.length - 4));
        const finalResult = await Subtle.digest("SHA-256", result);
        let array = new Uint8Array(finalResult);
        for (var i = 0; i < 4; i++)
            if (array[i] != data[data.length - 4 + i])
                throw new RangeError();
        array = new Uint8Array(20);
        copyArray(data, 1, array, 0, 20);
        return new Uint160(array.buffer);
    }
}