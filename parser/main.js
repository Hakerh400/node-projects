'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const parser = require('.');

const main = () => {
  const a = parser.parse(syntax, script, rules);
  if(a === null) return;

  log(a);
};

const syntax = `
  script{ s0 add s0 }

  s{ [ \\r\\n] }
  s0{ [ \\r\\n]* }
  s1{ [ \\r\\n]+ }

  opnd{ "0" | [1-9] [0-9]* }

  add{ opnd+addOp }
  addOp{ s0 "+" s0 }
`;

const script = '1 + 2 + 3 + 4 + '.repeat(1e3) + '0';

const rules = {
  ['[script]'](e){
    return e.elems[1].fst.v.reduce((a, b) => a + b, 0);
  },

  ['[opnd]'](e){
    return e | 0;
  },

  ['[add]'](e){
    return [...e.fst.arr].map(a => a.v);
  },
};

main();