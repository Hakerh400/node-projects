'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const {ArrayList} = require('../list');
const debug = require('../debug');
const cs = require('./ctors');

const {term} = cs;

const solve = function*(sys, targetIdents=null){
  if(targetIdents === null)
    targetIdents = yield [[sys, 'getIdents']];
  
  const queue = new ArrayList([[sys, null]]);

  while(!queue.isEmpty){
    let [sys, binding] = queue.shift();

    sys = yield [[sys, 'simplify']];
    if(sys === null) continue;

    const {rels} = sys;

    const push = function*(...bin){
      if(bin.length === 0){
        bin = binding;
        queue.push([new cs.System(rels), binding]);
        return;
      }

      assert(bin.length === 2);

      const sys = yield [[new cs.System(rels), 'subst'], new cs.Identifier(bin[0]), bin[1]];

      bin.unshift(binding);
      queue.push([sys, bin]);
    };

    // Reconstruct solution
    if(sys.empty){
      const bindings = [];

      for(let bin = binding; bin !== null; bin = bin[0]){
        const ident = bin[1]
        const expr = bin[2];

        bindings.push([ident, expr]);
      }

      const len = bindings.length;
      const bindingsObj = O.obj();

      for(let i = 0; i !== len; i++){
        const bin = bindings[i];
        const ident = bin[0];
        const expr = yield [[yield [[bin[1], 'substIdents'], term], 'simplify']];

        if(O.has(targetIdents, ident))
          bindingsObj[ident] = expr;

        for(let j = i + 1; j !== len; j++){
          const bin1 = bindings[j];
          const expr1 = bin1[1];

          bin1[1] = yield [[expr1, 'subst'], new cs.Identifier(ident), expr];
        }
      }

      for(const targetIdent of O.keys(targetIdents))
        if(!O.has(bindingsObj, targetIdent))
          bindingsObj[targetIdent] = term;

      return new cs.Solution(bindingsObj);
    }

    const rel = rels[0];
    const {type: eq, lhs, rhs} = rel;

    if(lhs.isIdent){
      const ident = lhs.name;

      if(eq && !(yield [[rhs, 'contains'], lhs, 1])){
        rels.shift(); // Optional
        yield [push, ident, rhs];
        continue;
      }

      yield [push, ident, term];
      yield [push, ident, newPair()];

      continue;
    }

    if(lhs.isPair){
      assert(rhs.isPair);

      rels.shift();

      if(eq){
        rels.push(new cs.Equation(lhs.fst, rhs.fst));
        rels.push(new cs.Equation(lhs.snd, rhs.snd));
        yield [push];
        continue;
      }

      rels.push(new cs.Inequation(lhs.fst, rhs.fst));
      yield [push];
      rels.pop();
      rels.push(new cs.Equation(lhs.fst, rhs.fst));

      rels.push(new cs.Inequation(lhs.snd, rhs.snd));
      yield [push];

      continue;
    }

    if(lhs.isSubst){
      const ctor = rel.constructor;
      const {target, pattern, replacement} = lhs;

      rels.shift();

      rels.push(new cs.Equation(target, pattern));
      rels.push(new ctor(replacement, rhs));
      yield [push];
      rels.pop();
      rels.pop();
      rels.push(new cs.Inequation(target, pattern));

      rels.push(new cs.Equation(target, term));
      rels.push(new ctor(term, rhs));
      yield [push];
      rels.pop();
      rels.pop();

      const pair = newPair();
      const {fst, snd} = pair;

      const subst1 = new cs.Substitution(fst, pattern, replacement);
      const subst2 = new cs.Substitution(snd, pattern, replacement);

      rels.push(new cs.Equation(target, pair));
      rels.push(new ctor(new cs.Pair(subst1, subst2), rhs));
      yield [push];

      continue;
    }

    O.logb();
    O.log(rel.toString())
    O.logb();
    assert.fail();
  }

  return null;
};

const newPair = () => {
  return new cs.Pair(newIdent(), newIdent());
};

// let identsNum = 0;

const newIdent = () => {
  return new cs.Identifier(Symbol()/*`a${identsNum++}`*/);
};

module.exports = {
  solve,
};