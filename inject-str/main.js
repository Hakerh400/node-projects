'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

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

  const f1 = () => (f=(a=A,b=atob(`B`.split([c=(+atob+[])[1]]+a+c)[1]))=>console.log(a-1?`/**\n *\n * ${b}\n *\n */\n${`\neval(atob\`${btoa(`(f=${f})()`.replace(/\d+/,a=>(c=~a&1)*(a>>c)+(c=~c+2)*-~((a<<c)+a*c)))}\`)`.replace(/.{100}/g,a=>`${a}\n`).trimRight()}`:b))();

  const f2 = `(${String(f1).replace('A', 18).replace('B',
    O.shuffle(strs.map((a, b) => {
      return O.ca(2, () => O.ca(2, () => 'a').join(O.rec(r, 18, b + 1))).join(btoa(a));
    })).join('')
  )})()`;

  const code = getOut(f2, 1);

  check: {
    let c = code;

    for(const str of strs){
      const out = getOut(c);
      const lines = O.sanl(out);
      const s = lines.length === 1 ? lines[0] : lines[2].slice(3);

      assert(s === str);

      c = out;
    }
  }

  log(code);
};

const getOut = (code, removeComment=0) => {
  const f = new Function('console', 'btoa', 'atob', code);
  let out;

  const console = {
    log(a){
      out = removeComment ? O.sanl(a).slice(6).join('\n') : a;
    },
  };

  f(console, btoa, atob);

  return out;
};

main();