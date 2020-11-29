'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const O = require('../omikron');
const calcCrc32 = require('../crc32');

const calcHash = (data, hashType, encoding=null) => {
  const result = getResult(data, hashType);
  if(encoding === null) return result;
  return result.toString(encoding);
};

const getResult = (data, hashType) => {
  switch(hashType){
    case 'crc32':
      return calcCrc32(data);
      break;

    default:
      const hash = crypto.createHash(hashType);
      hash.update(data);
      return hash.digest();
      break;
  }
};

module.exports = calcHash;