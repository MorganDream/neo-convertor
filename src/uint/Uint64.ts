import { UintVariable } from './UintVariable';
// import { BigInteger } from '../bigInteger';

export class Uint64 extends UintVariable{
    static readonly MaxValue = new Uint64(0xffffffff, 0xffffffff);
    static readonly MinValue = new Uint64();
    static readonly Zero = new Uint64();

    constructor(low: number = 0, high: number = 0) {
        super([low, high]);
    }

    public readonly and = (other: Uint64 | number): Uint64 => {
        if (typeof other === "number") {
            return this.and(new Uint64(other));
        }
        var bits = new Uint32Array(this.bits.length);
        for (var i = 0; i < bits.length; i++)
            bits[i] = this.bits[i] & other.bits[i];
        return new Uint64(bits[0], bits[1]);
    }

    public readonly not = (): Uint64 => {
        var bits = new Uint32Array(this.bits.length);
        for (var i = 0; i < bits.length; i++)
            bits[i] = ~this.bits[i];
        return new Uint64(bits[0], bits[1]);
    }

    public readonly or = (other: Uint64 | number): Uint64 => {
        if (typeof other === "number") {
            return this.or(new Uint64(other));
        }
        var bits = new Uint32Array(this.bits.length);
        for (var i = 0; i < bits.length; i++)
            bits[i] = this.bits[i] | other.bits[i];
        return new Uint64(bits[0], bits[1]);
    }

    // public readonly parse = (str: string): Uint64 => {
    //     let bi = BigInteger.parse(str);
    //     if (bi.bitLength() > 64) {
    //         throw new RangeError();
    //     }
    //     let arr = new Uint32Array(bi.toUint8Array(true, 8).buffer);
    //     return new Uint64(arr[0], arr[1]);
    // }

    public readonly rightShift = (shift: number): Uint64 => {
        if (shift === 0) {
            return this;
        }
        let shift_units = shift >>> 5;
        shift = shift & 0x1f;
        let bits = new Uint32Array(this.bits.length);
        for (let i = 0; i < bits.length; i++) {
            if (shift === 0) {
                bits[i] = this.bits[i + shift_units];
            } else {
                bits[i] = this.bits[i + shift_units] >>> shift | this.bits[i + shift_units + 1] << (32 - shift);
            }
        }
        return new Uint64(bits[0], bits[1]);
    }

    public readonly leftShift = (shift: number): Uint64 => {
        if (shift === 0) {
            return this;
        }

        let shift_units = shift >>> 5;
        shift = shift & 0x1f;
        let bits = new Uint32Array(this.bits.length);
        for (let i = 0; i < bits.length; i++) {
            if (shift === 0) {
                bits[i] = this.bits[i - shift_units];
            } else {
                bits[i] = this.bits[i - shift_units] << shift | this.bits[i - shift_units + 1] << (32 - shift);
            }
        }
        return new Uint64(bits[0], bits[1]);
    }

    public readonly subtract = (other: Uint64): Uint64 => {
        let low = this.bits[0] - other.bits[0];
        let high = this.bits[1] - other.bits[1] - (this.bits[0] < other.bits[0] ? 1 : 0);
        return new Uint64(low, high);
    }

    // public readonly toString = (): string => {
    //     return (new BigInteger(this.bits.buffer)).toString();
    // }

    public readonly toUint32 = (): number => {
        return this.bits[0];
    }
}