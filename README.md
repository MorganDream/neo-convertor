# neo-convertor
A tool to convert smart contract output data to human-readable one 
This tool is basicly derived from website https://peterlinx.github.io/DataTransformationTools/

## Install
```js
npm install neo-convertor
```

## How to use
```js
  import NeoConvertor from 'neo-convetor';
  // or import { Address } from 'neo-convertor';
  
  ...
  // convert a little endian scripthash to address form
  const scriptHashInBigendian = "ecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9";
  const address = NeoConvertor.Address.scriptHashToAddress(scriptHashInBigendian);
  console.log(address); //AeV59NyZtgj5AMQ7vY6yhr2MRvcfFeLWSb
```
