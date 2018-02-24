'use strict';

var hash = require('../hash');

module.exports = {
  encrypt,
};

function encrypt(buff, password){
  buff = Buffer.from(buff);

  var checksum = computeHash(buff);
  buff = Buffer.concat([buff, checksum]);

  var len = 32;
  var index = 0;

  var seed = Buffer.from(password);
  var hashBuff = computeHash(seed);

  updateHashBuff();

  return buff.map(a => a ^ getByte());

  function getByte(){
    if(index == len){
      updateHashBuff();
      index = 0;
    }

    return hashBuff[index++];
  }

  function updateHashBuff(){
    hashBuff = computeHash(Buffer.concat([seed, hashBuff]));
  }
}

function computeHash(buff){
  return hash(buff, 'sha256');
}