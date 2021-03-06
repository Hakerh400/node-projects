'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const SimpleParser = require('./simple-parser');
const cs = require('./ctors');
const error = require('./error');

const reservedChars = '\\s\\(\\)';

const identReg1 = new RegExp(`^[^${reservedChars}]+`);
const identReg2 = new RegExp(`^[^${reservedChars}]+$`);

class Parser extends SimpleParser{
  get structType(){ return 'function definition'; }

  *parseExpr(parseArgs=1){
    const expr = yield [[this, 'parseTargetExpr']];

    if(parseArgs){
      while(1){
        const char = this.char();
        if(char === null || char === ')') break;

        const arg = yield [[this, 'parseExpr'], 0];
        expr.addArg(arg);
      }
    }

    return expr;
  }

  *parseTargetExpr(){
    const char = this.char({force: 1});

    if(char === '('){
      this.matchOpenParen();
      const expr = yield [[this, 'parseExpr']];
      this.matchClosedParen();

      return expr;
    }

    if(identReg1.test(char)){
      const ident = yield [[this, 'parseIdent']];
      return new cs.Expression(ident);
    }

    this.err();
  }

  *parseIdent(){
    const ident = this.match(identReg1);

    if(ident === '=')
      this.err('Equals sign is a reserved operator');

    return ident;
  }
}

const parseProg = (str, builtins=O.obj()) => {
  str = str.trim().
    replace(/\-\-[^\r\n]*|\{\*.*?\*\}/gs, '').
    replace(/(?:\r\n|\r|\n)[ \t]/g, ' ');

  const parts = O.sanl(str).filter(a => a.trim().length !== 0);

  // if(parts.length < 2)
  //   error(`Source code must contain at least one function definition`);

  const prog = new cs.Program(builtins);

  for(const funcDefStr of parts){
    const funcDef = parseFuncDef(funcDefStr);
    const {name} = funcDef;

    if(prog.hasFunc(name))
      error(`Redefinition of function ${O.sf(name)}`);

    prog.addFunc(funcDef);
  }

  for(const func of prog.funcsArr){
    const {args, expr} = func;

    for(const ident in expr.idents){
      if(args.includes(ident)) continue;
      if(prog.hasFunc(ident)) continue;

      error(`Undefined identifier ${
        O.sf(ident)} in function ${
        O.sf(func.name)}`);
    }
  }

  return prog;
};

const parseFuncDef = str => {
  str = str.trim();

  const err = msg => {
    error(`${msg}\n\n${O.sf(str)}`);
  };

  const checkIdent = ident => {
    if(!identReg2.test(ident))
      err(`Invalid identifier ${O.sf(ident)}`);

    return ident;
  };

  const parts = str.split(/\s=\s/);

  if(parts.length !== 2)
    err(`Function definition must contain exactly one equals sign`);

  const lhs = parts[0].trim();

  if(lhs.length === 0)
    err(`Missing function name`);

  const idents = lhs.split(/\s+/);
  const name = checkIdent(idents[0]);
  const identsObj = O.obj();
  const args = [];

  for(let i = 1; i !== idents.length; i++){
    const ident = checkIdent(idents[i]);

    if(O.has(identsObj, ident))
      err(`Duplicate argument ${O.sf(ident)}`);

    identsObj[ident] = 1;
    args.push(ident);
  }

  const rhs = parts[1].trim();
  const parser = new Parser(rhs.trim());
  const expr = O.rec([parser, 'parseExpr']);

  parser.assertEof();

  const func = new cs.FunctionDefinition(name, args, expr);

  return func;
};

module.exports = {
  parseProg,
  parseFuncDef,
};