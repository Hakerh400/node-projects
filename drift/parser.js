'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const debug = require('../debug');
const O = require('../omikron');
const tokenizer = require('./tokenizer');
const cs = require('./ctors');

const {
  tokenize,
  tokTypes: tt,
  tok2str,
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

    if(lastFunc === null)
      lastArgsNum = null;

    lastFunc = func;

    const eqIndex = toks.indexOf(tt.EQ);
    const eqIndexLast = toks.lastIndexOf(tt.EQ);

    inCase(eqIndex === -1, `Missing equals sign`);
    inCase(eqIndexLast !== eqIndex, `Multiple equal signs`);

    const lhs = toks.slice(2, eqIndex);
    const rhs = toks.slice(eqIndex + 1);

    const parseLhs = function*(toks){
      const toksNum = toks.length;
      let index = 0;

      const next = (advance=1) => {
        inCase(eof(), `Expected a token, but found the end of the statement`);

        const tok = toks[index];
        if(advance) index++;

        return tok;
      };

      const eof = () => {
        return index === toksNum;
      };

      const parseArgs = function*(){
        const args = [];

        while(!eof())
          args.push(yield [parseExpr]);

        return args;
      };

      const parseExpr = function*(){
        let expr = yield [parseTerm];

        while(!eof()){
          const tok = next(0);

          if(tok === tt.CLOSED_PAREN)
            break;

          const isAsPat = !eof() && next(0) === tt.COLON;
          const ctor = isAsPat ? cs.AsPattern : cs.Call;

          if(isAsPat) next();

          const term = yield [parseTerm];

          expr = new ctor(expr, term);
        }

        return expr;
      };

      const parseTerm = function*(){
        const tok = next();

        if(tok === tt.VAR)
          return new cs.Variable(next());

        if(tok === tt.TYPE)
          return new cs.Type(next());

        if(tok === tt.OPEN_PAREN){
          const expr = yield [parseExpr];
          inCase(next() !== tt.CLOSED_PAREN, `Missing closed parenthese`);
          return expr;
        }

        if(tok === tt.STAR)
          return cs.any

        err(`Unexpected token ${O.sf(tok2str(tok))}`);
      };

      const args = O.rec(parseArgs);
      inCase(!eof(), `Extra tokens found on the LHS`);

      return new cs.Lhs(args);
    };

    const parseRhs = function*(toks){
      const toksNum = toks.length;
      let index = 0;

      const next = (advance=1) => {
        inCase(eof(), `Expected a token, but found the end of the statement`);

        const tok = toks[index];
        if(advance) index++;

        return tok;
      };

      const eof = () => {
        return index === toksNum;
      };

      const parseExpr = function*(){
        let expr = yield [parseTerm];

        while(!eof()){
          const tok = next(0);

          if(tok === tt.CLOSED_PAREN)
            break;

          const term = yield [parseTerm];
          expr = new cs.Call(expr, term);
        }

        return expr;
      };

      const parseTerm = function*(){
        const tok = next();

        if(tok === tt.VAR)
          return new cs.Variable(next());

        if(tok === tt.TYPE)
          return new cs.Type(next());

        if(tok === tt.OPEN_PAREN){
          const expr = yield [parseExpr];
          inCase(next() !== tt.CLOSED_PAREN, `Missing closed parenthese`);
          return expr;
        }

        err(`Unexpected token ${O.sf(tok2str(tok))}`);
      };

      const expr = O.rec(parseExpr);
      inCase(!eof(), `Extra tokens found on the RHS`);

      return new cs.Rhs(expr);
    };

    const lhsParsed = O.rec(parseLhs, lhs);
    const rhsParsed = O.rec(parseRhs, rhs);

    const {args, argsNum} = lhsParsed;
    const {result} = rhsParsed;

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