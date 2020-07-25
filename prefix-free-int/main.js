'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

O.bion(1);

const main = () => {
  for(let m = 2n; m <= 20n; m++){
    for(let n = 0n; n !== m; n++){
      let bits = '';
      ser(a => bits += a ? 1 : 0, m, n);

      let bs = bits;
      const a = deser(a => [bs[0] | 0, bs = bs.slice(1)][0], m);

      assert(a === n);
    }
  }

  log('ok');
};

const ser = (f, m, n) => {
  const a = log2(m);
  const b = 1n << a;
  const c = (b << 1n) - m;

  if(n < c){
    write(f, a, n);
  }else{
    write(f, a, c + (n - c) % (b - c));
    f(n >= b);
  }
};

const deser = (f, m) => {
  const a = log2(m);
  const b = 1n << a;
  const c = (b << 1n) - m;
  let n = read(f, a);

  if(n >= c && f()) n += b - c;
  return n;
};

const write = (f, a, b) => {
  for(let i = 0n; i !== a; i++){
    f(b & 1n);
    b >>= 1n;
  }
};

const read = (f, a) => {
  let n = 0n;

  for(let i = 0n; i !== a; i++)
    if(f()) n |= 1n << i;

  return n;
};

const log2 = n => {
  let a = 0n;
  let b = 0n;

  n--;

  while(n){
    a++;
    if(!(n & 1n)) b = 1n;
    n >>= 1n;
  }

  return a - b;
};

main();