'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const O = require('../omikron');

module.exports = hash;

function hash(data, hashType='sha512', encoding=null){
  const hash = crypto.createHash(hashType);
  hash.update(data);

  let result = hash.digest();
  if(encoding !== null) result = result.toString(encoding);

  return result;
}