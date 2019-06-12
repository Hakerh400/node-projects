'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const arrOrder = require('../arr-order');

const identChars = O.chars('a', 26, 1).concat(O.chars('A', 26, 1));

module.exports = obfuscate;

function obfuscate(str, evalScript){
  str = str.replace(/ +/g, '');

  let defs = O.sanl(str).filter(a => a.length !== 0);
  const len = defs.length;

  const mainFuncName = O.last(defs).match(/^\w+/)[0];

  defs.sort((d1, d2) => {
    if(d1.length < d2.length) return -1;
    if(d1.length > d2.length) return 1;
    return O.rand(2) ? 1 : -1;
  });

  const names = [];
  const params = new Set();

  defs.forEach((def, i) => {
    const name = def.match(/^\w+/)[0];
    names.push(name);

    for(const match of O.exec(def, /(\w+)\=\>/g)){
      const param = match[1];
      params.add(param);
    }
  });

  const idStart = params.size;
  const toName = id => getName(idStart + id);
  const randName = () => toName(O.rand(len));

  defs = defs.map((def, i) => {
    def = def.replace(/\(\)/g, () => {
      return `(${randName()})`;
    });

    def += i !== len - 1 ? ',' : ';';

    return def;
  });

  defs = defs.join('\n');

  names.forEach((name, i) => {
    defs = defs.split(name).join(toName(i));
  });

  str = `'use strict';\n\n` +
    `const\n` +
    `${defs}\n\n` +
    `${toName(names.indexOf(mainFuncName))}(${randName()});`;

  if(evalScript) new Function(str)();
  return str;
}

function getName(id){
  return arrOrder.arr(identChars, id + 1).join('');
}