'use strict';

var buffer = require('../buffer.js');

var buffsStr = [
  [
    '45 85 C0 0F 84 BF 00 00 00 48 83 B9 A0 00 00 00 00 74 2F 49 8B 01 49 83 21 00 4D 8D 4B D8 48 8B',
    '89 A0 00 00 00 49 89 43 D8 E8 16 2A 02 00 48 8B 06 48 85 C0 0F 84 FD 00 00 00 83 CF FF E9 E6 00',
    '00 00 48 8B 89 A8 00 00 00 48 83 A3 A8 00 00 00 00 48 85 C9 74 0A 48 8B 01 BA 01 00 00 00 FF 10'
  ], [
    'E9 C3 00 00 00 90 90 90 90'
  ]
];

var buffs = buffsStr.map(buffStr => buffer.createFromHex(buffStr));

module.exports = {
  getBuffer
};

function getBuffer(index){
  return Buffer.from(buffs[index]);
}