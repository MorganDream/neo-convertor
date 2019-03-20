import { Wallet } from "../wallets";
import { Uint160 } from "../uint";
import { hexToBytes } from "../libs";

const endianChange = (inSmall: string) => {
    let result: Array<string> = [],num;
    if (inSmall.indexOf("0x") === 0) {
        inSmall = inSmall.slice(2);
    }else if (inSmall) {
        result = ['0x'];
    }
    let smaArray = hexToBytes(inSmall).reverse();
    for (let i = 0; i < smaArray.length; i++) {
        num = smaArray[i];
        if (num < 16) {
            num = smaArray[i].toString(16);
            num="0"+num;
        }else {num = smaArray[i].toString(16);}
        result.push(num);
    }
    return result.join("");
}

export class Address {
    static readonly changeEndian = (scriptHash: string): string => {
        if (scriptHash.substr(0, 2) === '0x' && scriptHash.length !== 42) {
            throw new Error(`${scriptHash} is not in legal format.`);
        }
        if (scriptHash.substr(0, 2) !== '0x' && scriptHash.length !== 40) {
            throw new Error(`${scriptHash} is not in legal format.`);
        }

        let result = endianChange(scriptHash);
        if (result.substr(0, 2) === '0x') {
            result = result.slice(2);
        }
        return result;
    }

    private static readonly _addressToScriptHash = 
        async (address: string): Promise<Uint160> => {
            if (address.length !== 34) {
                return Promise.reject(`Illegal Format Address! ${address} length is no 34.`);
            }

            return await Wallet.toScriptHash(address); 
        }

    static readonly addressToScriptHash = 
        async (address: string, littleEndian: boolean = false): Promise<string> => {
            const resultInUint160 = await Address._addressToScriptHash(address);
            let scriptHash = resultInUint160.toString();
            if (littleEndian) {
                scriptHash = "0x" + scriptHash;
                scriptHash = endianChange(scriptHash);
            }
            return scriptHash;
        }

    private static readonly _scriptHashToAddress = 
        async (scriptHash: string): Promise<string> => {
            let hash160 = Uint160.parse(scriptHash);
            const result = await Wallet.toAddress(hash160);
            return result;
        }
    
    static readonly scriptHashToAddress = 
        async (scriptHash: string, littleEndian: boolean = false): Promise<string> => {
            if (littleEndian) {
                if (scriptHash.substr(0, 2) === "0x") {
                    return Promise.reject(`${scriptHash} begins with "0x" and is not a little endian hash.`);
                }
                if (scriptHash.length !== 40) {
                    return Promise.reject(`Illegal Format Script Hash! ${scriptHash} length is not 40.`);
                }
            }
            let xScriptHash = littleEndian ? endianChange(scriptHash) : scriptHash;
            if (xScriptHash.substr(0, 2) === "0x") {
                xScriptHash = xScriptHash.slice(2);
            }
            if (scriptHash.length !== 40) {
                return Promise.reject(`Illegal Format Script Hash! ${scriptHash} length is not 40.`);
            }
            return await Address._scriptHashToAddress(xScriptHash);        
        }
}