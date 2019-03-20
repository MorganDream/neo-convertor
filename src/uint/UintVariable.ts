export class UintVariable {
    public readonly bits: Uint32Array;
    constructor(bits: number | Uint8Array | Uint32Array | Array<number>) {
        if (typeof bits === 'number') {
            if (bits <= 0 || bits % 32 !== 0) {
                throw new RangeError();
            }
            this.bits = new Uint32Array(bits / 32);
        } else if (bits instanceof Uint8Array) {
            if (bits.length === 0 || bits.length % 4 !== 0) {
                throw new RangeError();
            }
            if (bits.byteOffset % 4 === 0) {
                this.bits = new Uint32Array(bits.buffer, bits.byteOffset, bits.length / 4);
            } else {
                var bits_new = new Uint8Array(bits);
                this.bits = new Uint32Array(bits_new.buffer);
            }
        } else if (bits instanceof Uint32Array) {
            this.bits = bits;
        } else if (bits instanceof Array) {
            if (bits.length === 0) {
                throw new RangeError();
            }
            this.bits = new Uint32Array(bits);
        } else {
            this.bits = new Uint32Array(0);
        }
    }

    public readonly equals = (other: UintVariable): boolean =>  {
        let longer: Uint32Array, shorter: Uint32Array;
        if (other.bits.length > this.bits.length) {
            longer = other.bits;
            shorter = this.bits;
        } else {
            longer = this.bits;
            shorter = other.bits;
        }
        return longer.every((bit, index) => bit === (shorter[index] || 0));
    }

    public readonly toString = (): string => {
        var s = "";
        for (var i = this.bits.length * 32 - 4; i >= 0; i -= 4)
            s += ((this.bits[i >>> 5] >>> (i % 32)) & 0xf).toString(16);
        return s;
    }
}