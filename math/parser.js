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

  for(let i = 0; i !== defsNum; i++){
    const info = defs[i];
    const start = info[0];

    assert(typeof start === 'string');

    if(/^data\b/.test(start)){
      const str = O.rec(stringify, info);
      system.addType(O.rec(parseTypeDef, str));
      continue;
    }

    if(/^[a-z][a-zA-Z0-9]*\s*\:\:/.test(start)){
      const str = O.rec(stringify, info);
      const parts = str.split(/\s*\:\:\s*/);
      assert(parts.length === 2);

      const funcName = parts[0];
      const signature = O.rec(parseSignature, parts[1]);
      const funcDef = new cs.FuncDef(funcName, signature);

      i++;

      while(1){
        if(i === defsNum) break;

        const info = defs[i];
        const start = info[0];

        assert(typeof start === 'string');

        const match = start.match(/^[a-z][a-zA-Z0-9]*/);
        if(match === null) break;
        if(match[0] !== funcName) break;

        const fcase = O.rec(parseFuncCase, info);
        funcDef.addCase(fcase);
      }

      i--;

      system.addFunc(funcDef);
      continue;
    }

    assert.fail(info);
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

const stringify = function*(def){
  if(typeof def === 'string')
    return def;

  return O.rec(O.mapr, def, function*(def){
    return O.tco(stringify, def);
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

const parseSignature = function*(str){
  const types = str.split(/\s*\-\>\s*/);
  const typesNum = types.length;
  let type = null;

  for(let i = typesNum - 1; i !== -1; i--){
    const typeName = types[i];
    const t = new cs.Type(typeName);

    if(type === null){
      type = t;
      continue;
    }

    type = new cs.Type('->');
    type.addArg(t);
    type.addArg(type);
  }

  assert(type !== null);

  return type;
};

const parseFuncCase = function*(info){
  const str = yield [stringify, info];
  const parts = str.split(/\s*\=\s*/);
  assert(parts.length === 2);

  const [lhs, rhs] = parts;

  const match = lhs.match(/^[a-z][a-zA-Z0-9]*/);
  assert(match !== null);

  const funcName = match[0];
  const fcase = new cs.FuncCase(funcName);

  const args = yield [parseFormalArgs, lhs.slice(funcName.length)];

  O.exit(args);

  return fcase;
};

module.exports = {
  parse,
};