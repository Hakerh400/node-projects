'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const debug = require('../debug');
const O = require('../omikron');
const tokenizer = require('./tokenizer');

const {
  tokenize,
  tokTypes: tt,
  toks2str,
  toksLen,
  err,
} = tokenizer;

const parse = str => {
  const objIdentSym = O.obj();

  const hasIdent = ident => {
    return O.has(objIdentSym, ident);
  };

  const ident2sym = ident => {
    if(hasIdent(ident))
      return objIdentSym[ident];

    return objIdentSym[ident] = Symbol(ident);
  };

  let currentType = null;
  let lastFunc = null;
  let lastArgsNum = null;

  for(const info of tokenize(str)){
    const {line, toks, isLabel, popLevel} = info;

    const err = msg => {
      error(line, msg);
    };

    const inCase = (test, msg) => {
      if(test) err(msg);
    };

    if(popLevel !== 0){
      assert(popLevel === 1);

      currentType = null;
      lastFunc = null;
    }

    const tlen = toksLen(toks);

    if(isLabel){
      // Type definition

      assert(O.last(toks) === tt.COLON);

      inCase(currentType !== null, `Nested type definitions are not allowed`);
      inCase(tlen !== 2 || toks[0] !== tt.TYPE, `Invalid type definition`);

      const typeIdent = toks[1];
      inCase(hasIdent(typeIdent), `Redefinition of type ${O.sf(typeIdent)}`);

      const type = ident2sym(typeIdent);

      currentType = type;
      lastFunc = null;

      continue;
    }

    // Function definition

    inCase(toks[0] !== tt.VAR, `Function name must be in lowercase`);

    const funcIdent = toks[1];

    inCase(
      hasIdent(funcIdent) && ident2sym(funcIdent) !== lastFunc,
      `All case definitions of function ${O.sf(funcIdent)} must be continuous`);

    const func = ident2sym(funcIdent);

    lastFunc = func;

    const eqIndex = toks.indexOf(tt.EQ);
    const eqIndexLast = toks.lastIndexOf(tt.EQ);

    inCase(eqIndex === -1, `Missing equals sign`);
    inCase(eqIndexLast !== eqIndex, `Multiple equal signs`);

    const lhs = toks.slice(1, eqIndex);
    const rhs = toks.slice(eqIndex + 1);

    const args = O.rec(parseLhs, lhs);
    const result = O.rec(parseRhs, rhs);
    const argsNum = args.length;

    inCase(
      lastArgsNum !== null && argsNum !== lastArgsNum,
      `Case definitions of function ${
        O.sf(funcIdent)} differ in the number of arguments (${
        lastArgsNum} vs ${argsNum})`);

    lastArgsNum = argsNum;
  }

  O.exit();
};

const error = (line, msg) => {
  assert(typeof line === 'string');
  assert(typeof msg === 'string');

  err(`${msg}\n\n${line}`);
};

module.exports = {
  parse,
};