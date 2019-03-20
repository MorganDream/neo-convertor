import { Uint64 } from '../uint';
import { copyArray } from '../libs';

export interface DoubleParts {
    sign: number;
    man: Uint64;
    exp: number;
    fFinite: boolean;
}

export class BigInteger {
    static readonly DB = 26;
    static readonly DM = (1 << BigInteger.DB) - 1;
    static readonly DV = BigInteger.DM + 1;
    private _sign: number;
    private _bits: Array<number>;

    constructor(value: number | string | ArrayBuffer | Uint8Array) {
        this._sign = 0;
        this._bits = new Array();
        if (typeof value === "number") {
            if (!isFinite(value) || isNaN(value)) {
                throw new RangeError();
            }
            var parts = BigInteger.getDoubleParts(value);
            if (parts.man.equals(Uint64.Zero) || parts.exp <= -64) {
                return ;
            }
            if (parts.exp <= 0) {
                this.fromUint64(parts.man.rightShift(-parts.exp), parts.sign);
            } else if (parts.exp <= 11) {
                this.fromUint64(parts.man.leftShift(parts.exp), parts.sign);
            } else {
                parts.man = parts.man.leftShift(11);
                parts.exp -= 11;
                let units = Math.ceil((parts.exp + 64) / BigInteger.DB);
                let cu = Math.ceil(parts.exp / BigInteger.DB);
                let cbit = cu * BigInteger.DB -parts.exp;
                for (let i = cu; i < units; i++) {
                    this._bits[i] = parts.man.rightShift(cbit + (i - cu) * BigInteger.DB).toUint32() & BigInteger.DM;
                }
                if (cbit > 0) {
                    this._bits[cu - 1] = (parts.man.toUint32() << (BigInteger.DB - cbit)) & BigInteger.DM;
                }
                this._sign = parts.sign;
                this.clamp();
            }
        } else if (typeof value === "string") {
            this.fromString(value);
        } else if (value instanceof ArrayBuffer) {
            this.fromUint8Array(new Uint8Array(value));
        } else if (value instanceof Uint8Array) {
            this.fromUint8Array(value);
        }
    }

    static readonly getDoubleParts = (dbl: number): DoubleParts => {
        let uu = new Uint32Array(2);
        new Float64Array(uu.buffer)[0] = dbl;
        let result: DoubleParts = {
            sign: 1 - ((uu[1] >>> 30) & 2),
            man: new Uint64(uu[0], uu[1] & 0x000FFFFF),
            exp: (uu[1] >>> 20) & 0x7FF,
            fFinite: true
        }

        if (result.exp === 0) {
            if (!result.man.equals(Uint64.Zero)) {
                result.exp = -1074;
            }
        } else if (result.exp === 0x7FF) {
            result.fFinite = false;
        } else {
            result.man = result.man.or(new Uint64(0, 0x00100000));
            result.exp -= 1075;
        }
        return result;
    }

    static readonly MinusOne = new BigInteger(-1);
    static readonly One = new BigInteger(1);
    static readonly Zero = new BigInteger(0);

    static readonly fromString = (str: string, radix?: number) => {
        if (radix === void 0) { radix = 10; }
        let bi = new BigInteger(0);
        bi.fromString(str, radix);
        return bi;
    };

    public readonly fromString = (str: string, radix?: number) => {
        if (radix === undefined) {
            radix = 10;
        }
        if (radix < 2 || radix > 36) {
            throw new RangeError();
        }
        if (str.length === 0) {
            this._sign = 0;
            this._bits = [];
            return;
        }
        let bits_radix = [radix];
        let bits_a = [0];
        let first = str.charCodeAt(0);
        let withSign = first === 0x2b || first === 0x2d;
        this._sign = first === 0x2d ? -1 : +1;
        this._bits = [];
        for (let i = withSign? 1 : 0; i < str.length; i++) {
            bits_a[0] = str.charCodeAt(i);
            if (bits_a[0] >= 0x30 && bits_a[0] <= 0x39)
                bits_a[0] -= 0x30;
            else if (bits_a[0] >= 0x41 && bits_a[0] <= 0x5a)
                bits_a[0] -= 0x37;
            else if (bits_a[0] >= 0x61 && bits_a[0] <= 0x7a)
                bits_a[0] -= 0x57;
            else
                throw new RangeError();
            let bits_temp = new Array();
            BigInteger.multiplyTo(this._bits, bits_radix, bits_temp);
            BigInteger.addTo(bits_temp, bits_a, this._bits);
        }
        this.clamp();
    }

    static readonly fromUint8Array = (arr: Uint8Array, sign?: number, littleEndian?: boolean): BigInteger => {
        if (sign === undefined) { sign = 1; }
        if (littleEndian === undefined) { littleEndian = true; }
        let bi = new BigInteger(0);
        bi.fromUint8Array(arr, sign, littleEndian);
        return bi;
    }

    public readonly fromUint8Array = (arr: Uint8Array, sign?: number, littleEndian?: boolean) => {
        if (sign === undefined) { sign = 1; }
        if (littleEndian === undefined) { littleEndian = true; }
        if (!littleEndian) {
            let arr_new = new Uint8Array(arr.length);
            for (let i = 0; i < arr.length; i++)
                arr_new[arr.length - 1 - i] = arr[i];
            arr = arr_new;
        }
        let actual_length = BigInteger.getActualLength(arr);
        let bits = actual_length * 8;
        let units = Math.ceil(bits / BigInteger.DB);
        this._bits = [];
        for (let i = 0; i < units; i++) {
            let cb = i * BigInteger.DB;
            let cu = Math.floor(cb / 8);
            cb %= 8;
            this._bits[i] = ((arr[cu] | arr[cu + 1] << 8 | arr[cu + 2] << 16 | arr[cu + 3] << 24) >>> cb) & BigInteger.DM;
        }
        this._sign = sign < 0 ? -1 : +1;
        this.clamp();
    }

    public readonly fromUint64 = (i: Uint64, sign: number) => {
        while (i.bits[0] != 0 || i.bits[1] != 0) {
            this._bits.push(i.toUint32() & BigInteger.DM);
            i = i.rightShift(BigInteger.DB);
        }
        this._sign = sign;
        this.clamp();
    }

    static readonly getActualLength = (arr: Uint8Array): number => {
        let actual_length = arr.length;
        for (let i = arr.length - 1; i >= 0; i--)
            if (arr[i] != 0) {
                actual_length = i + 1;
                break;
            }
        return actual_length;
    }

    public readonly isZero = () => {
        return this._sign === 0;
    }

    static readonly mod = (x: BigInteger | number, y: BigInteger | number) => {
        let bi_x = typeof x === "number" ? new BigInteger(x) : x;
        let bi_y = typeof y === "number" ? new BigInteger(y) : y;
        if (bi_x._sign == 0)
            return bi_x;
        if (bi_y._sign == 0)
            return bi_y;
        if (bi_x._sign == 1 && bi_x._bits == null)
            return bi_y;
        if (bi_x._sign == -1 && bi_x._bits == null)
            return bi_y.negate();
        if (bi_y._sign == 1 && bi_y._bits == null)
            return bi_x;
        if (bi_y._sign == -1 && bi_y._bits == null)
            return bi_x.negate();
        let bits_r = new Array();
        BigInteger.multiplyTo(bi_x._bits, bi_y._bits, bits_r);
        return BigInteger.create((bi_x._sign > 0) == (bi_y._sign > 0) ? +1 : -1, bits_r);
    }

    static readonly multiply = (x: BigInteger | number, y: BigInteger | number): BigInteger => {
        let bi_x = typeof x === "number" ? new BigInteger(x) : x;
        let bi_y = typeof y === "number" ? new BigInteger(y) : y;
        if (bi_x._sign == 0)
            return bi_x;
        if (bi_y._sign == 0)
            return bi_y;
        if (bi_x._sign == 1 && bi_x._bits == null)
            return bi_y;
        if (bi_x._sign == -1 && bi_x._bits == null)
            return bi_y.negate();
        if (bi_y._sign == 1 && bi_y._bits == null)
            return bi_x;
        if (bi_y._sign == -1 && bi_y._bits == null)
            return bi_x.negate();
        let bits_r = new Array();
        BigInteger.multiplyTo(bi_x._bits, bi_y._bits, bits_r);
        return BigInteger.create((bi_x._sign > 0) == (bi_y._sign > 0) ? +1 : -1, bits_r);
    }

    public readonly multiply = (other: BigInteger) => {
        return BigInteger.multiply(this, other);
    }

    static readonly multiplyTo = (x: Array<number>, y: Array<number>, r?: Array<number>, offset?: number) => {
        if (offset === undefined) {
            offset = 0;
        }
        if (r === undefined) {
            r = new Array();
        }
        if (x.length > y.length) {
            let t = x;
            x = y;
            y = t;
        }
        for (let i = x.length + y.length - 2; i >= 0; i-- ) {
            r[i + offset] = 0;
        }
        for (let i = 0; i < x.length; i++ ) {
            if (x[i] === 0) {
                continue;
            }
            for (let j = 0; j < y.length; j ++) {
                let c = x[i] * y[j];
                if (c === 0 ) {
                    continue;
                }
                let k = i + j;
                do {
                    c += r[k + offset] || 0;
                    r[k + offset] = c & BigInteger.DM;
                    c = Math.floor(c / BigInteger.DV);
                    k++;
                } while (c > 0);
            }
        }
    }

    public readonly negate = () => {
        return BigInteger.create(-this._sign, this._bits);
    };

    static readonly parse = (str: string): BigInteger => {
        return BigInteger.fromString(str);
    }

    static readonly pow = (value: BigInteger | number, exponent: number) => {
        let bi_v = typeof value === "number" ? new BigInteger(value) : value;
        if (exponent < 0 || exponent > 0x7fffffff)
            throw new RangeError();
        if (exponent == 0)
            return BigInteger.One;
        if (exponent == 1)
            return bi_v;
        if (bi_v._sign == 0)
            return bi_v;
        if (bi_v._bits.length == 1) {
            if (bi_v._bits[0] == 1)
                return bi_v;
            if (bi_v._bits[0] == -1)
                return (exponent & 1) != 0 ? bi_v : BigInteger.One;
        }
        let h = BigInteger.bitLengthInternal(exponent);
        let bi_new = BigInteger.One;
        for (let i = 0; i < h; i++) {
            let e = 1 << i;
            if (e > 1)
                bi_v = BigInteger.multiply(bi_v, bi_v);
            if ((exponent & e) != 0)
                bi_new = BigInteger.multiply(bi_v, bi_new);
        }
        return bi_new;
    }

    public readonly pow = (exponent: number) => {
        return BigInteger.pow(this, exponent);
    }

    static readonly subtract = (x: BigInteger | number, y: BigInteger | number): BigInteger => {
        let bi_x = typeof x === "number" ? new BigInteger(x) : x;
        let bi_y = typeof y === "number" ? new BigInteger(y) : y;
        if (bi_x._sign == 0)
            return bi_y.negate();
        if (bi_y._sign == 0)
            return bi_x;
        if ((bi_x._sign > 0) != (bi_y._sign > 0))
            return BigInteger.add(bi_x, bi_y.negate());
            let c = BigInteger.compareAbs(bi_x, bi_y);
        if (c == 0)
            return BigInteger.Zero;
        if (c < 0)
            return BigInteger.subtract(bi_y, bi_x).negate();
            let bits_r = new Array();
        BigInteger.subtractTo(bi_x._bits, bi_y._bits, bits_r);
        return BigInteger.create(bi_x._sign, bits_r, true);
    }

    public readonly subtract = (other: BigInteger) => {
        return BigInteger.subtract(this, other);
    }

    static readonly subtractTo = (x: Array<number>, y: Array<number>, r?: Array<number>): boolean => {
        if (r == null)
            r = [];
        var l = Math.min(x.length, y.length);
        var c = 0, i = 0;
        while (i < l) {
            c += x[i] - y[i];
            r[i++] = c & BigInteger.DM;
            c >>= BigInteger.DB;
        }
        if (x.length < y.length)
            while (i < y.length) {
                c -= y[i];
                r[i++] = c & BigInteger.DM;
                c >>= BigInteger.DB;
            }
        else
            while (i < x.length) {
                c += x[i];
                r[i++] = c & BigInteger.DM;
                c >>= BigInteger.DB;
            }
        return c < 0;
    }

    public readonly toInt32 = () => {
        if (this._sign == 0)
            return 0;
        if (this._bits.length == 1)
            return this._bits[0] * this._sign;
        return ((this._bits[0] | this._bits[1] * BigInteger.DV) & 0x7fffffff) * this._sign;
    }

    public readonly toString = (radix?: number) => {
        if (radix === undefined) { radix = 10; }
        if (this._sign == 0)
            return "0";
        if (radix < 2 || radix > 36)
            throw new RangeError();
        let s = "";
        for (let bi: BigInteger = this; bi._sign != 0;) {
            let r = BigInteger.divRem(bi, radix);
            let rem = Math.abs(r.remainder.toInt32());
            if (rem < 10)
                rem += 0x30;
            else
                rem += 0x57;
            s = String.fromCharCode(rem) + s;
            bi = r.result;
        }
        if (this._sign < 0)
            s = "-" + s;
        return s;
    }

    public readonly toUint8Array = (littleEndian?: boolean, length?: number) => {
        if (littleEndian === void 0) { littleEndian = true; }
        if (this._sign == 0)
            return new Uint8Array(length || 1);
        var cb = Math.ceil(this._bits.length * BigInteger.DB / 8);
        var array = new Uint8Array(length || cb);
        for (var i = 0; i < array.length; i++) {
            var offset = littleEndian ? i : array.length - 1 - i;
            var cbits = i * 8;
            var cu = Math.floor(cbits / BigInteger.DB);
            cbits %= BigInteger.DB;
            if (BigInteger.DB - cbits < 8)
                array[offset] = (this._bits[cu] >>> cbits | this._bits[cu + 1] << (BigInteger.DB - cbits)) & 0xff;
            else
                array[offset] = this._bits[cu] >>> cbits & 0xff;
        }
        length = length || BigInteger.getActualLength(array);
        if (length < array.length)
            array = array.subarray(0, length);
        return array;
    }

    static readonly add = (x: BigInteger | number, y: BigInteger | number): BigInteger => {
        let bi_x = typeof x === "number" ? new BigInteger(x) : x;
        let bi_y = typeof y === "number" ? new BigInteger(y) : y;
        if (bi_x._sign == 0)
            return bi_y;
        if (bi_y._sign == 0)
            return bi_x;
        if ((bi_x._sign > 0) != (bi_y._sign > 0))
            return BigInteger.subtract(bi_x, bi_y.negate());
            let bits_r = new Array();
        BigInteger.addTo(bi_x._bits, bi_y._bits, bits_r);
        return BigInteger.create(bi_x._sign, bits_r);
    }

    public readonly add = (other: BigInteger) => {
        return BigInteger.add(this, other);
    }

    static readonly addTo = (x: Array<number>, y: Array<number>, r: Array<number>) => {
        if (x.length < y.length) {
            let t = x;
            x = y;
            y = t;
        }
        let c = 0, i = 0;
        while (i < y.length) {
            c += x[i] + y[i];
            r[i++] = c & BigInteger.DM;
            c >>>= BigInteger.DB;
        }
        while (i < x.length) {
            c += x[i];
            r[i++] = c & BigInteger.DM;
            c >>>= BigInteger.DB;
        }
        if (c > 0)
            r[i] = c;
    };

    public readonly bitLength = () => {
        let l = this._bits.length;
        if (l === 0) {
            return 0
        }
        return --l * BigInteger.DB + BigInteger.bitLengthInternal(this._bits[l]);
    }

    static readonly bitLengthInternal =  (w: number): number => {
        return (w < 1 << 15 ? (w < 1 << 7
            ? (w < 1 << 3 ? (w < 1 << 1
                ? (w < 1 << 0 ? (w < 0 ? 32 : 0) : 1)
                : (w < 1 << 2 ? 2 : 3)) : (w < 1 << 5
                ? (w < 1 << 4 ? 4 : 5)
                : (w < 1 << 6 ? 6 : 7)))
            : (w < 1 << 11
                ? (w < 1 << 9 ? (w < 1 << 8 ? 8 : 9) : (w < 1 << 10 ? 10 : 11))
                : (w < 1 << 13 ? (w < 1 << 12 ? 12 : 13) : (w < 1 << 14 ? 14 : 15)))) : (w < 1 << 23 ? (w < 1 << 19
            ? (w < 1 << 17 ? (w < 1 << 16 ? 16 : 17) : (w < 1 << 18 ? 18 : 19))
            : (w < 1 << 21 ? (w < 1 << 20 ? 20 : 21) : (w < 1 << 22 ? 22 : 23))) : (w < 1 << 27
            ? (w < 1 << 25 ? (w < 1 << 24 ? 24 : 25) : (w < 1 << 26 ? 26 : 27))
            : (w < 1 << 29 ? (w < 1 << 28 ? 28 : 29) : (w < 1 << 30 ? 30 : 31)))));
    };

    static readonly compare = (x: BigInteger | number, y: BigInteger | number): number => {
        let bi_x = typeof x === "number" ? new BigInteger(x) : x;
        let bi_y = typeof y === "number" ? new BigInteger(y) : y;
        if (bi_x._sign >= 0 && bi_y._sign < 0)
            return +1;
        if (bi_x._sign < 0 && bi_y._sign >= 0)
            return -1;
        let c = BigInteger.compareAbs(bi_x, bi_y);
        return bi_x._sign < 0 ? -c : c;
    }

    static readonly compareAbs = (x: BigInteger, y: BigInteger): number => {
        if (x._bits.length > y._bits.length)
            return +1;
        if (x._bits.length < y._bits.length)
            return -1;
        for (let i = x._bits.length - 1; i >= 0; i--)
            if (x._bits[i] > y._bits[i])
                return +1;
            else if (x._bits[i] < y._bits[i])
                return -1;
        return 0;
    }

    public readonly compareTo = (other: BigInteger): number => {
        return BigInteger.compare(this, other);
    }

    static readonly create = (sign: number, bits: Array<number>, clamp?: boolean) => {
        if (clamp === undefined) { clamp = false; }
        let bi = new BigInteger(1);
        bi._sign = sign;
        bi._bits = bits;
        if (clamp)
            bi.clamp();
        return bi;
    };

    static readonly divRem = (x: BigInteger | number, y: BigInteger | number) => {
        let bi_x = typeof x === "number" ? new BigInteger(x) : x;
        let bi_y = typeof y === "number" ? new BigInteger(y) : y;
        if (bi_y._sign == 0)
            throw new RangeError();
        if (bi_x._sign == 0)
            return { result: BigInteger.Zero, remainder: BigInteger.Zero };
        if (bi_y._sign == 1 && bi_y._bits == null)
            return { result: bi_x, remainder: BigInteger.Zero };
        if (bi_y._sign == -1 && bi_y._bits == null)
            return { result: bi_x.negate(), remainder: BigInteger.Zero };
        let sign_result = (bi_x._sign > 0) == (bi_y._sign > 0) ? +1 : -1;
        let c = BigInteger.compareAbs(bi_x, bi_y);
        if (c == 0)
            return { result: sign_result > 0 ? BigInteger.One : BigInteger.MinusOne, remainder: BigInteger.Zero };
        if (c < 0)
            return { result: BigInteger.Zero, remainder: bi_x };
        let bits_result = new Array();
        let bits_rem = new Array();
        copyArray(bi_x._bits, 0, bits_rem, 0, bi_x._bits.length);
        let df = bi_y._bits[bi_y._bits.length - 1];
        for (let i = bi_x._bits.length - 1; i >= bi_y._bits.length - 1; i--) {
            let offset = i - bi_y._bits.length + 1;
            let d = bits_rem[i] + (bits_rem[i + 1] || 0) * BigInteger.DV;
            let max = Math.floor(d / df);
            if (max > BigInteger.DM)
                max = BigInteger.DM;
            let min = 0;
            while (min != max) {
                let bits_sub_1 = new Array(offset + bi_y._bits.length);
                for (let i_1 = 0; i_1 < offset; i_1++)
                    bits_sub_1[i_1] = 0;
                bits_result[offset] = Math.ceil((min + max) / 2);
                BigInteger.multiplyTo(bi_y._bits, [bits_result[offset]], bits_sub_1, offset);
                if (BigInteger.subtractTo(bits_rem, bits_sub_1))
                    max = bits_result[offset] - 1;
                else
                    min = bits_result[offset];
            }
            let bits_sub = new Array(offset + bi_y._bits.length);
            for (let i_2 = 0; i_2 < offset; i_2++)
                bits_sub[i_2] = 0;
            bits_result[offset] = min;
            BigInteger.multiplyTo(bi_y._bits, [bits_result[offset]], bits_sub, offset);
            BigInteger.subtractTo(bits_rem, bits_sub, bits_rem);
        }
        return { result: BigInteger.create(sign_result, bits_result, true), remainder: BigInteger.create(bi_x._sign, bits_rem, true) };
    };

    public readonly clamp = () => {
        var l = this._bits.length;
        while (l > 0 && (this._bits[--l] | 0) === 0)
            this._bits.pop();
        while (l > 0)
            this._bits[--l] |= 0;
        if (this._bits.length == 0)
            this._sign = 0;
    }
}
