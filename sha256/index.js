'use strict';

var O = require('../framework');

var MAX_UINT = 2 ** 32;

module.exports = sha256;

function sha256(buff){
  var hh = getArrH();
  var kk = getArrK();

  var chunks = getChunks(buff);

  chunks.forEach(chunk => {
    var w = new Uint32Array(64);

    for(var i = 0; i < 16; i++){
      w[i] = chunk.readUInt32BE(i << 2);
    }

    for(var i = 16; i < 64; i++){
      var s0 = (rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ shr(w[i - 15], 3)) | 0;
      var s1 = (rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ shr(w[i - 2], 10)) | 0;

      w[i] = w[i - 16] + w[i - 7] + s0 + s1 | 0;
    }

    var [a, b, c, d, e, f, g, h] = hh;

    for(var i = 0; i < 64; i++){
      var s1 = (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) | 0;
      var ch = ((e & f) ^ (~e & g)) | 0;
      var temp1 = (h + s1 + ch + kk[i] + w[i]) | 0;
      var s0 = (rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) | 0;
      var maj = ((a & b) ^ (a & c) ^ (b & c)) | 0;
      var temp2 = (s0 + maj) | 0;

      h = g | 0;
      g = f | 0;
      f = e | 0;
      e = d + temp1 | 0;
      d = c | 0;
      c = b | 0;
      b = a | 0;
      a = temp1 + temp2 | 0;
    }

    [a, b, c, d, e, f, g, h].forEach((a, i) => {
      hh[i] = hh[i] + a | 0;
    });
  });

  var digest = computeDigest(hh);

  return digest;
}

function getArrH(){
  var arr = firstNPrimes(8);

  arrPow(arr, 1 / 2);
  arrFrac(arr);

  return new Uint32Array(arr);
}

function getArrK(){
  var arr = firstNPrimes(64);

  arrPow(arr, 1 / 3);
  arrFrac(arr);

  return new Uint32Array(arr);
}

function getChunks(buff){
  var bits = buffToBits(buff);
  var len = bits.length;
  var k = getVarK(len);

  bits += '1' + '0'.repeat(k);

  var buffL = Buffer.alloc(8);
  buffL.writeUInt32BE(len / MAX_UINT, 0);
  buffL.writeUInt32BE(len % MAX_UINT, 4);

  bits += buffToBits(buffL);

  var chunks = (bits.match(/.{512}/g) || []).map(a => {
    return bitsToBuff(a);
  });

  return chunks;
}

function getVarK(len){
  for(var i = 0; i < 512; i++){
    if(!((len + i + 65) % 512)) return i;
  }
}

function computeDigest(a){
  return Buffer.concat([...a].map(a => {
    var buff = Buffer.alloc(4);
    buff.writeUInt32BE(a, 0);
    return buff;
  }));
}

function shr(a, b){
  a = toUint32(a);
  a = [...a.toString(2).padStart(32, '0')];

  while(b--){
    a.pop();
    a.unshift('0');
  }

  return parseInt(a.join``, 2) | 0;
}

function rot(a, b){
  a = toUint32(a);
  a = [...a.toString(2).padStart(32, '0')];

  while(b--){
    a.unshift(a.pop());
  }

  return parseInt(a.join``, 2) | 0;
}

function toUint32(a){
  var buff = Buffer.alloc(4);
  buff.writeInt32BE(a | 0, 0);
  return buff.readUInt32BE(0);
}

function arrPow(arr, pow){
  arr.forEach((a, i) => {
    a **= pow;
    arr[i] = a;
  });
}

function arrFrac(arr, bitsNum = 32){
  arr.forEach((a, i) => {
    a = a % 1 * 2 ** bitsNum;

    var bits = O.ca(bitsNum, i => {
      return !!(a & (1 << (bitsNum - i - 1))) | 0;
    }).join``;

    a = parseInt(bits, 2);

    arr[i] = a;
  });
}

function buffToBits(buff){
  return [...buff].map(byte => {
    return byte.toString(2).padStart(8, '0');
  }).join``;
}

function bitsToBuff(bits){
  return Buffer.from((bits.match(/\d{8}/g) || []).map(a => {
    return parseInt(a, 2);
  }));
}

function firstNPrimes(a){
  return O.ca(a, i => nthPrime(i + 1));
}

function nthPrime(a){
  for(var i = 1; a; i++){
    if(isPrime(i)) a--;
  }

  return i - 1;
}

function isPrime(a){
  if(a == 1) return false;

  for(var i = 2; i < a; i++){
    if(!(a % i)) return false;
  }

  return true;
}