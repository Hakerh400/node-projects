'use strict';

var buffer = require('.');

setTimeout(main);

function main(){
  var buff = buffer.fromHex(['31 32 33', '34 35']);
  var str = buff.toString();

  console.log(str);
}