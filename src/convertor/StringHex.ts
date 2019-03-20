export class StringHex{
    private static readonly _stringToHex = (src: string): Array<string> => {
        if (src === "")
            return [""];
        let hexChar: Array<string> = [];
        for (let i = 0; i < src.length; i++) {
            hexChar.push((src.charCodeAt(i)).toString(16));
        }
        return hexChar;
    }

    static readonly stringToHex = (src: string): string => {
        return StringHex._stringToHex(src).join("");
    }

    private static readonly _hexToString = (hex: string): Array<string> => {
        let trimhex = hex.trim();
        let rawStr = trimhex.substr(0, 2).toLowerCase() === "0x" ? trimhex.substr(2) : trimhex;
        let len = rawStr.length;
        if (len % 2 !== 0) {
            console.error("Illegal Format ASCII Code!");
            return [""];
        }
        let cuChar;
        let result = [];
        for (let i = 0; i < len; i = i + 2) {
            cuChar = parseInt(rawStr.substr(i, 2), 16);
            result.push(String.fromCharCode(cuChar));
        }
        return result;
    }

    static readonly hexToString = (hex: string): string => {
        return StringHex._hexToString(hex).join("");
    }
}