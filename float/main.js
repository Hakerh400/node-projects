'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const {Float, Uint} = require('.');

const ms = 52;
const es = 11;

setTimeout(main);

function main(){
  while(1){
    var n1 = O.randf(1e5) - 1e5 / 2;
    var n2 = O.randf(1e5) - 1e5 / 2;

    n1 = 58;
    n2 = 17;

    var f1 = float(n1);
    var f2 = float(n2);

    var s1 = n1 / n2;
    var s2 = f1.div(f2).num();

    O.proc.exit(0);
    //require('../debug')({n1, n2, s1, s2});

    if(s2 !== s1){
      log({n1, n2, s1, s2});
      O.proc.exit(1);
    }
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