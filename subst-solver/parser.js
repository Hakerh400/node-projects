'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const cs = require('./ctors');

const parse = str => {
  str = str.trim();

  let empty, nempty;

  const updateEmpty = () => {
    empty = str.length === 0;
    nempty = !empty;
  };

  updateEmpty();

  const test = reg => {
    return reg.test(str);
  };

  const match = (reg, force=0, trim=1) => {
    const match = str.match(reg);

    if(match === null){
      assert(!force);
      return match;
    }

    const sub = match[0];

    str = str.slice(sub.length);
    if(trim) str = str.trimLeft();
    updateEmpty();

    return sub;
  };

  const parseSystem = function*(){
    const system = new cs.System();

    while(nempty){
      const rel = yield [parseRel];
      system.addRel(rel);
    }

    return system;
  };

  const parseRel = function*(){
    const lhs = yield [parseExpr];
    const op = yield [parseRelOp]
    const rhs = yield [parseExpr];

    const rel = op === '=' ?
      new cs.Equation(lhs, rhs) :
      new cs.Inequation(lhs, rhs);

    return rel;
  };

  const parseRelOp = function*(){
    let m;

    if(m = match(/^\=/)) return m;
    if(m = match(/^\!\=/)) return m;

    assert.fail(str);
  };

  const parseExpr = function*(){
    let m;

    if(match(/^\./))
      return cs.Term.term;

    if(m = match(/^[a-zA-Z0-9\_]+/))
      return new cs.Identifier(m);

    if(m = match(/^\(/)){
      const fst = yield [parseExpr];
      const snd = yield [parseExpr];
      match(/^\)/, 1);
      return new cs.Pair(fst, snd);
    }

    if(m = match(/^\[/)){
      const target = yield [parseExpr];
      const pattern = yield [parseExpr];
      const replacement = yield [parseExpr];
      match(/^\]/, 1);
      return new cs.Substitution(target, pattern, replacement);
    }

    assert.fail(str);
  };

  return O.rec(parseSystem);
};

module.exports = {
  parse,
};