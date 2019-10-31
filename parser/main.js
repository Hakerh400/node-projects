'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const parser = require('.');

const main = () => {
  const a = parser.parse(syntax, script, rules);
  if(a === null) return;

  log(a.add());
};

class Add{
  constructor(a, b){
    this.a = a;
    this.b = b;
  }

  add(){
    const stack = [[this.a, this.b]];

    while(1){
      const [a, b] = O.last(stack);

      if(a instanceof Add){
        stack.push([a.a, a.b]);
        continue;
      }

      if(b instanceof Add){
        stack.push([b.a, b.b]);
        continue;
      }

      const c = a + b;

      stack.pop();
      if(stack.length === 0) return c;

      const e = O.last(stack);
      if(e[0] instanceof Add) e[0] = c;
      else e[1] = c;
    }
  }
}

const syntax = `
  script{ s0 add s0 }

  s{ [ \\r\\n] }
  s0{ [ \\r\\n]* }
  s1{ [ \\r\\n]+ }

  add{ opnd s0 "+" s0 num }
  opnd{ num | add }
  num{ "0" | [1-9] [0-9]* }
`;

const script = '1 + 2 + 3 + 4 + '.repeat(1e3) + '0';

const rules = {
  ['[script]'](e){
    return e.elems[1].fst.v;
  },

  ['[add]'](e){
    return new Add(e.fst.fst.v, e.elems[4].fst.v);
  },

  ['[opnd]'](e){
    return e.fst.fst.v;
  },

  ['[num]'](e){
    return e | 0;
  },
};

main();