import { Sha256 } from "./Sha256";

export class Subtle {
    static readonly digest = (algorithm: string, data: ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer | SharedArrayBuffer> => {
        return new Promise(function (resolve, reject) {
            if (algorithm != "SHA-256") {
                reject(new RangeError());
                return;
            }
            try {
                resolve(Sha256.computeHash(data));
            }
            catch (e) {
                reject(e);
            }
        }); 
    }
}