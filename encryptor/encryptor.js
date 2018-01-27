'use strict';

var stream = require('stream');
var hash = require('./hash.js');

module.exports = {
  createHashStream
};

function createHashStream(password){
  var len = 64;
  var index = 0;

  var seed = Buffer.from(password);
  var hashBuff = hash(seed);

  updateHashBuff();

  return new stream.Transform({
    transform: transformFunc
  });

  function transformFunc(chunk, encoding, callback){
    var data = chunk.map(a => a ^ getByte());

    callback(null, data);
  }

  function getByte(){
    if(index == len){
      updateHashBuff();
      index = 0;
    }

    return hashBuff[index++];
  }

  function updateHashBuff(){
    hashBuff = hash(Buffer.concat([seed, hashBuff]));
  }
}