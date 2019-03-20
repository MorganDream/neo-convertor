import { createUint8ArrayFromArrayBuffer } from "../libs";

export class Sha256 {
    static readonly K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    static readonly computeHash = (data: ArrayBuffer | ArrayBufferView) => {
        var H = new Uint32Array([
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
        ]);
        var l = data.byteLength / 4 + 2;
        var N = Math.ceil(l / 16);
        var M = new Array(N);
        var view = createUint8ArrayFromArrayBuffer(data);
        for (var i = 0; i < N; i++) {
            M[i] = new Uint32Array(16);
            for (var j = 0; j < 16; j++) {
                M[i][j] = (view[i * 64 + j * 4] << 24) | (view[i * 64 + j * 4 + 1] << 16) |
                    (view[i * 64 + j * 4 + 2] << 8) | (view[i * 64 + j * 4 + 3]);
            }
        }
        M[Math.floor(data.byteLength / 4 / 16)][Math.floor(data.byteLength / 4) % 16] |= 0x80 << ((3 - data.byteLength % 4) * 8);
        M[N - 1][14] = (data.byteLength * 8) / Math.pow(2, 32);
        M[N - 1][15] = (data.byteLength * 8) & 0xffffffff;
        var W = new Uint32Array(64);
        var a, b, c, d, e, f, g, h;
        for (var i = 0; i < N; i++) {
            for (var t = 0; t < 16; t++)
                W[t] = M[i][t];
            for (var t = 16; t < 64; t++)
                W[t] = (Sha256.σ1(W[t - 2]) + W[t - 7] + Sha256.σ0(W[t - 15]) + W[t - 16]) & 0xffffffff;
            a = H[0];
            b = H[1];
            c = H[2];
            d = H[3];
            e = H[4];
            f = H[5];
            g = H[6];
            h = H[7];
            for (var t = 0; t < 64; t++) {
                var T1: number = h + Sha256.Σ1(e) + Sha256.Ch(e, f, g) + Sha256.K[t] + W[t];
                var T2: number = Sha256.Σ0(a) + Sha256.Maj(a, b, c);
                h = g;
                g = f;
                f = e;
                e = (d + T1) & 0xffffffff;
                d = c;
                c = b;
                b = a;
                a = (T1 + T2) & 0xffffffff;
            }
            H[0] = (H[0] + a) & 0xffffffff;
            H[1] = (H[1] + b) & 0xffffffff;
            H[2] = (H[2] + c) & 0xffffffff;
            H[3] = (H[3] + d) & 0xffffffff;
            H[4] = (H[4] + e) & 0xffffffff;
            H[5] = (H[5] + f) & 0xffffffff;
            H[6] = (H[6] + g) & 0xffffffff;
            H[7] = (H[7] + h) & 0xffffffff;
        }
        var result = new Uint8Array(32);
        for (var i = 0; i < H.length; i++) {
            result[i * 4 + 0] = (H[i] >>> (3 * 8)) & 0xff;
            result[i * 4 + 1] = (H[i] >>> (2 * 8)) & 0xff;
            result[i * 4 + 2] = (H[i] >>> (1 * 8)) & 0xff;
            result[i * 4 + 3] = (H[i] >>> (0 * 8)) & 0xff;
        }
        return result.buffer;
    };
    static readonly ROTR = (n: number, x: number): number => { return (x >>> n) | (x << (32 - n)); };
    static readonly Σ0 = (x: number): number => { return Sha256.ROTR(2, x) ^ Sha256.ROTR(13, x) ^ Sha256.ROTR(22, x); };
    static readonly Σ1 = (x: number): number => { return Sha256.ROTR(6, x) ^ Sha256.ROTR(11, x) ^ Sha256.ROTR(25, x); };
    static readonly σ0 = (x: number): number => { return Sha256.ROTR(7, x) ^ Sha256.ROTR(18, x) ^ (x >>> 3); };
    static readonly σ1 = (x: number): number => { return Sha256.ROTR(17, x) ^ Sha256.ROTR(19, x) ^ (x >>> 10); };
    static readonly Ch = (x: number, y: number, z: number): number => { return (x & y) ^ (~x & z); };
    static readonly Maj = (x: number, y: number, z: number): number => { return (x & y) ^ (x & z) ^ (y & z); };
}