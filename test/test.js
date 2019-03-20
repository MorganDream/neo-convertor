'use strict';
const expect = require('chai').expect;
const { StringHex, Address, HexNumber } = require('../dist/src/convertor');

describe('Test converting between string and hex', () => {
  const hex = "7472616e73666572";
  const str = "transfer";
  it('String => Hex', () => {
    expect(StringHex.stringToHex(str)).to.equal(hex);
  });
  it('Hex => String', () => {
    expect(StringHex.hexToString(hex)).to.equal(str);
  });
});

describe('Test converting between address and scripthash', () => {
  const scriptHash_bigEndian = 'ecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9';
  const scriptHash_littleEndian = 'f91d6b7085db7c5aaf09f19eeec1ca3c0db2c6ec';
  const address = 'AeV59NyZtgj5AMQ7vY6yhr2MRvcfFeLWSb';
  it('Big Endian: ScriptHash => Address', async () => {
    const result = await Address.scriptHashToAddress(scriptHash_bigEndian);
    expect(result).to.equal(address);
  })
  it('Big Endian: Address => ScriptHash', async () => {
    const result = await Address.addressToScriptHash(address);
    expect(result).to.equal(scriptHash_bigEndian);
  });
  it('Little Endian: ScriptHash => Address', async () => {
    const result = await Address.scriptHashToAddress(scriptHash_littleEndian, true);
    expect(result).to.equal(address);
  });
  it('Little Endian: Address => ScriptHash', async () => {
    const result = await Address.addressToScriptHash(address, true);
    expect(result).to.equal(scriptHash_littleEndian);
  });
  it('Big Endian => Little Endian', () => {
    expect(Address.changeEndian(scriptHash_bigEndian)).to.equal(scriptHash_littleEndian);
  });
  it('Little Endian => Big Endian', () => {
    expect(Address.changeEndian(scriptHash_littleEndian)).to.equal(scriptHash_bigEndian);
  })
});

describe('Test converting between hex number and number', () => {
  const number = 100000000;
  const hexNumber = '00e1f505';
  it('Number => Hex Number', () => {
    expect(HexNumber.numberToHexNumber(number)).to.equal(hexNumber);
  })
  it('Hex Number => Number', () => {
    expect(HexNumber.hexNumberToNumber(hexNumber)).to.equal(number);
  })
});