'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const {Float, Uint} = require('.');

const DEBUG = 0;

const ms = 52;
const es = 11;

setTimeout(main);

function main(){
  var a = float(O.randf(100));
  var b = float(O.randf(100));

  if(DEBUG){
    var a = float(52.918151615246664);
    var b = float(8.77267328927176);
    logBin(a.num(), b.num());
    log('[S] ---> ' + (a.num() + b.num()).toString(2));
    log();
  }

  var aa = a.num();
  var bb = b.num();

  log(aa);
  log(bb);

  log();
  log(aa + bb);
  log(a.add(b).num());

  if(DEBUG){
    float(aa + bb).log();
    a.add(b, 1);
  }
}

function float(val){
  const buf = Buffer.alloc(8);
  buf.writeDoubleBE(val, 0);

  const bits = [...buf]
    .map(a => a.toString(2).padStart(8, '0'))
    .join('');

  const s = bits[0] | 0;
  const m = new Uint(ms, i => bits[63 - i] | 0);
  const e = new Uint(es, i => bits[es - i] | 0);

  return new Float(s, m, e);
}

function logBin(a, b){
  a = a.toString(2);
  b = b.toString(2);

  if(!a.includes('.')) a += '.0';
  if(!b.includes('.')) b += '.0';

  var i1 = a.indexOf('.');
  var i2 = b.indexOf('.');

  if(i1 !== i2){
    if(i1 > i2) b = '0'.repeat(i1 - i2) + b;
    else a = '0'.repeat(i2 - i1) + a;
  }

  var len = Math.max(a.length, b.length);

  if(a.length !== len) a += '0'.repeat(len - a.length);
  else b += '0'.repeat(len - b.length);

  log('[A] ---> ' + a);
  log('[B] ---> ' + b);
}