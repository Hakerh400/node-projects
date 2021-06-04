'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const cs = require('./ctors');

const parse = src => {
  const system = new cs.System();
  const defs = parseDefs(src);
  const defsNum = defs.length;

  for(let i = 0; i !== defs.length; i++){
    const info = defs[i];

    const start = info[0];
    assert(typeof start === 'string');

    if(/^data\b/.test(start)){
      const str = O.rec(stringifyDef, info);
      system.addType(O.rec(parseTypeDef, str));

      continue;
    }

    if(/^[a-z][a-zA-Z0-9]*\s*\:\:/.test(start)){
      const funcName = start.split(':')[0];
    }
  }

  return system;
};

const parseDefs = src => {
  assert(!src.includes('\t'));

  const lines = O.sanl(src).
    map(line => line.trimRight()).
    filter(line => line.length !== 0);

  const indents = [0];
  const stack = [[]];

  for(let line of lines){
    const indent = line.match(/^ */)[0].length;
    const lastIndent = O.last(indents);

    line = line.slice(indent);

    if(indent > lastIndent){
      indents.push(indent);
      stack.push([line]);
      continue;
    }

    while(1){
      const lastIndent = O.last(indents);
      const lastElem = O.last(stack);

      if(indent === lastIndent){
        lastElem.push([line]);
        break;
      }

      assert(indent < lastIndent);

      indents.pop();
      stack.pop();

      O.last(O.last(stack)).push(lastElem);
    }
  }

  return O.uni(stack);
};

const stringifyDef = function*(def){
  if(typeof def === 'string')
    return def;

  return O.rec(O.mapr, def, function*(def){
    return O.tco(stringifyDef, def);
  }).join(' ');
};

const parseTypeDef = function*(str){
  str = str.trim().replace(/\s+/g, ' ');

  const lhsAndRhs = str.split(/ ?\= ?/);
  assert(lhsAndRhs.length === 2);

  const [lhs, rhs] = lhsAndRhs;

  const lhsData = lhs.split(' ');
  assert(lhsData.length === 2);
  assert(lhsData[0] === 'data');

  const name = lhsData[1];
  const typeDef = new cs.TypeDef(name);
  const ctorDefs = rhs.split(/ ?\| ?/);

  for(const str of ctorDefs)
    typeDef.addCtor(yield [parseCtorDef, str]);

  return typeDef;
};

const parseCtorDef = function*(str){
  const parts = str.split(' ');
  assert(parts.length >= 1);

  const name = parts.shift();
  const ctorDef = new cs.CtorDef(name);

  for(const str of parts){
    const arg = new cs.Type(str);
    ctorDef.addArg(arg);
  }

  return ctorDef;
};

module.exports = {
  parse,
};