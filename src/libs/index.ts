export function copyArray<T>(srcArr: Array<T> | Uint8Array, srcOffset: number, 
    dstArr: Array<T> | Uint8Array, dstOffset: number, count: number): void{
        for (let i = 0; i < count; i++) {
            dstArr[i + dstOffset] = srcArr[i + srcOffset];
        }
}

export function createUint8ArrayFromArrayBuffer(buffer: ArrayBuffer | ArrayBufferView): Uint8Array {
    if (buffer instanceof Uint8Array)
        return buffer;
    else if (buffer instanceof ArrayBuffer)
        return new Uint8Array(buffer);
    else {
        let view = buffer;
        return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    }
}

export function hexToBytes(str: string): Uint8Array {
    if ((str.length & 1) !== 0) {
        throw new RangeError();
    }
    var bytes = new Uint8Array(str.length / 2);
    return bytes.map((byte, index) => parseInt(str.substr(index * 2, 2), 16));
}

export function convertUint8ArrayToHexString(src: Uint8Array): string {
    var s = "";
    for (var i = 0; i < src.length; i++) {
        s += (src[i] >>> 4).toString(16);
        s += (src[i] & 0xf).toString(16);
    }
    return s;
}
