import { UintVariable } from './UintVariable';
import { hexToBytes } from '../libs';

export class Uint160 extends UintVariable{
    static readonly Zero: Uint160 = new Uint160();
    constructor(value: ArrayBuffer = new ArrayBuffer(20)) {
        super(new Uint32Array(value));
        if (value.byteLength !== 20) {
            throw new RangeError();
        }
    }

    static readonly parse = (str: string): Uint160 => {
        if (str.length !== 40) {
            throw new RangeError();
        }
        let x = hexToBytes(str);
        let y = new Uint8Array(x.length);
        for (let i = 0; i < y.length; i++) {
            y[i] = x[x.length - i - 1];
        }
        return new Uint160(y.buffer);
    }
}