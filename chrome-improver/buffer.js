'use strict';

module.exports = {
  createFromHex
};

function createFromHex(arr){
  var str = arr.join``;
  var matches = str.match(/[0-9a-f]{2}/gi);
  var hex = matches.map(match => parseInt(match, 16));

  return Buffer.from(hex);
}