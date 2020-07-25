'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const main = () => {
  O.bion(1);

  for(let m = 2n; m <= 20n; m++){
    log(`Number: ${m}`);
    log.inc();

    for(let n = 0n; n !== m; n++){
      let bits = '';
      ser(a => bits += a ? 1 : 0, n, m);

      let bs = bits;
      const a = deser(a => [bs[0] | 0, bs = bs.slice(1)][0], m);

      log(`${a} ---> ${bits}`);
    }

    log.dec();
    log('\n');
  }
};

const ser = (f, n, m) => {
  const a = log2(m);
  const b = 1n << a;
  const c = (b << 1n) - m;

  if(n < c){
    for(let i = 0n; i !== a; i++){
      f(n & 1n);
      n >>= 1n;
    }
  }else{
    const d = b - c;
    let e = c + (n - c) % d;

    for(let i = 0n; i !== a; i++){
      f(e & 1n);
      e >>= 1n;
    }

    f(n >= b);
  }
};

const deser = (f, m) => {
  const a = log2(m);
  const b = 1n << a;
  const c = (b << 1n) - m;
  let n = 0n;

  for(let i = 0n; i !== a; i++)
    if(f()) n |= (1n << i);

  if(n < c) return n;

  const d = b - c;
  if(f()) n += d;

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