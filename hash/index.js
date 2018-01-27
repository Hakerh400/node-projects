'use strict';

var crypto = require('crypto');

module.exports = hash;

function hash(data, hashType = 'sha512'){
  var hash = crypto.createHash(hashType);

  hash.update(Buffer.from(data));

  return hash.digest();
}