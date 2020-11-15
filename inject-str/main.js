'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Table = require('../table');

const btoa = a => Buffer.from(String(a)).toString('base64').replace(/\=+/g, '');
const atob = a => Buffer.from(String(a).replace(/\s+/g, ''), 'base64').toString();

const strs = [
  ...O.ca(20, () => 'A'),
];

const main = () => {
  const c = a => a & 1 ? a * 3 + 1 : a / 2;

  const r = function*(a, b){
    if(b === 0) return a;
    return yield [r, c(a), b - 1];
  };

  const f1 = () => (f=(a=A,b=atob(`B`.split([c=(+atob+[])[1]]+a+c)[1]))=>console.log(a-1?`${`eval(atob\`${btoa(`(f=${f})()`.replace(/\d+/,a=>(c=~a&1)*(a>>c)+(c=~c+2)*-~((a<<c)+a*c)))}\`)`.replace(/.{100}/g,a=>`${a}\n`)}\n/**\n *\n * ${b.replace(/\n/g,'\n'+(d=' ')+'* '+d+' ')}\n *\n */`:b))();

  const encode = strs => {
    const digits = O.chars('0', '9');
    const lower = O.chars('a', 'z');
    const upper = lower.toUpperCase();
    const chars = digits + lower + upper;

    const randChar = () => {
      return O.randElem(chars);
    };

    const arr = O.shuffle(strs.map((a, b) => {
      return [a, O.ca(2, () => 'a').join(O.rec(r, 18, b + 1))];
    }));

    const extra = arr.map(() => '');

    const arr2str = () => {
      return arr.map(([a, b], c) => extra[c] + b + btoa(a) + b).join('');
    };

    const has = str => {
      return atob(arr2str()).includes(str);
    };

    for(let i = 0; i !== arr.length; i++){
      const str = arr[i][0];
      const s = arr2str();

      if(has(str))
        extra[i] = randChar();

      assert(!has(str));
    }

    return arr2str();
  };

  const encoded = encode(strs);
  const decoded = atob(encoded);

  assertNotExposed: {
    for(const str of strs){
      if(decoded.includes(str)){
        log(str);
        O.logb();
        log(decoded);
        O.logb();

        assert.fail();
      }
    }
  }

  const f2 = `(${String(f1).replace('A', 18).replace('B', encoded)})()`;

  const code = getOut(f2, 1);

  check: {
    let c = code;

    strs.forEach((str, index) => {
      const out = getOut(c);
      const s = index !== strs.length - 1 ? O.sanl(out).filter(a => a.startsWith(' ')).map(a => a.slice(3).trim()).join('\n').trim() : out;

      if(s !== str){
        log(str);
        log(s);
      }

      assert(s === str);

      c = out;
    });
  }

  log(code);
};

const getOut = (code, removeComment=0) => {
  const f = new Function('console', 'btoa', 'atob', code);
  let out;

  const console = {
    log(a){
      out = removeComment ? O.sanl(a).reverse().slice(5).reverse().join('\n').trim() : a;
    },
  };

  f(console, btoa, atob);

  return out;
};

main();