'use strict';

const O = require('../framework');
const hash = require('../hash');

class Encryptor{
  constructor(password){
    this.password = Buffer.from(password);
    this.seed = calcHash(this.password);
  }

  encrypt(data){
    var {password} = this;
    
    var buff = Buffer.from(data);
    var mask = this.seed;

    buff = buff.map((byte, index) => {
      byte ^= mask[index & 31];

      if((index + 1 & 31) === 0)
        mask = calcHash(Buffer.concat([password, mask]));

      return byte;
    });

    return buff;
  }

  decrypt(data){
    return this.encrypt(data);
  }
};

module.exports = Encryptor;

function calcHash(buff){
  return hash(buff, 'sha256');
}