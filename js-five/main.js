'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const fin = path.join(testDir, 'input.js');
const fout = path.join(testDir, 'output.js');

const main = () => {
  const input = O.rfs(fin, 1);
  const output = transpile(input);

  O.wfs(fout, output);

  new Function(output)();
};

const transpile = str => {
  const chars = '!+[]';

  const encode = str => {
    return [...str].map(a => {
      a = O.cc(a);
      let s = '';
      for(let i = 0; i !== 4; i++)
        s += chars[(a >> (3 - i << 1)) & 3];
      return s;
    }).join('');
  };

  const decode=([[...a]])=>a.reduce(([a,b],c,d)=>(b=b*4+'!+[]'.indexOf(c),d+1&3)?[a,b]:[a+String.fromCharCode(b),0],['',0])[0]

  Object.defineProperty(Function.prototype, 'A', {
    get(){
      log(this);
      return this;
      // O.exit();
    },
  });

  let code = `eval((${decode})\`${encode(str)}\`)`;

  while(1){
    const codeNew = code;

    if(codeNew === code) break;
    code = codeNew;
  }

  return code;
};

main();