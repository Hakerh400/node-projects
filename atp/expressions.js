'use strict';

const O = require('../framework');

const CHAR_CODE_BASE_CONST = 'A'.charCodeAt(0);
const CHAR_CODE_BASE_VAR = 'a'.charCodeAt(0);

class Expression{
  constructor(opnds){
    this.opnds = opnds;
  }

  static parse(ctorsArr, str){
    var unary = O.obj();
    var binary = O.obj();
    var literals = [];

    var ctors = O.obj();
    var protos = O.obj();
    var ops = [];

    ctorsArr.forEach(ctor => {
      var proto = ctor.prototype;

      if(proto.isLiteral()){
        literals.push(ctor);
        return;
      }

      var op = proto.op();

      if(proto.isUnary()) unary[op] = ctor;
      else if(proto.isBinary()) binary[op] = ctor;
      else throw new TypeError(`Only unary and binary operators are supported (got "${op}")`);

      ctors[op] = ctor;
      protos[op] = proto;

      ops.push(op);
    });

    if(literals.length === null)
      throw new TypeError('Expected at least 1 literal constructor');

    ops.sort((op1, op2) => {
      var len1 = op1.length;
      var len2 = op2.length;

      if(len1 > len2) return -1;
      if(len1 < len2) return 1;
      return 0;
    });

    var regStr = `${ops.map(op => {
      return op.replace(/./g, a => `\\${a}`);
    }).join('|')}|[\\(\\)]|[A-Za-z0-9]+`;

    var reg = new RegExp(regStr, 'g');
    var tokens = str.match(reg);

    if(tokens === null)
      throw new SyntaxError('No expressions found');

    var opsStack = [];
    var opndsStack = [];
    var ustack = [];

    var nextOpnd = true;

    tokens.forEach(token => {
      if(nextOpnd){
        if(!(token === '(' || token in unary || !(token in binary)))
          throw new SyntaxError(`Expected operand, but got "${token}"`);
      }else{
        if(!(token === ')' || token in binary))
          throw new SyntaxError(`Expected operator, but got "${token}"`);
      }

      var lctor = literals.find(literal => literal.is(token));

      if(lctor){
        var opnd = lctor.from(token);
        opndsStack.push(opnd);
        nextOpnd = false;
      }else{
        var op = token;

        if(!isOp(op, nextOpnd))
          throw new SyntaxError(`Unknown ${nextOpnd ? 'literal' : 'binary operator'} "${op}"`);

        var ipr = getIpr(op, nextOpnd);

        while(opsStack.length !== 0 && ipr <= calcSpr())
          nextElem();

        if(op === ')'){
          opsStack.pop();
          ustack.pop();
          nextOpnd = false;
        }else{
          opsStack.push(op);
          ustack.push(nextOpnd);
          nextOpnd = true;
        }
      }
    });

    while(opsStack.length !== 0)
      nextElem();

    return opndsStack[0];

    function nextElem(){
      var ctor = getCtor(opsStack.pop(), ustack.pop());
      var proto = ctor.prototype;

      if(proto.isUnary()){
        if(opndsStack.length < 1)
          throw new SyntaxError(`No enough operands for unary operator "${proto.op()}"`);

        var opnd = opndsStack.pop();
        opndsStack.push(new ctor(opnd));
      }else{
        if(opndsStack.length < 2)
          throw new SyntaxError(`No enough operands for binary operator "${proto.op()}"`);

        var opnd2 = opndsStack.pop();
        var opnd1 = opndsStack.pop();
        opndsStack.push(new ctor(opnd1, opnd2));
      }
    }

    function isOp(op, un){
      if(op === '(' || op === ')') return true;

      if(un) return op in unary;
      return op in binary;
    }

    function getCtor(op, un){
      if(un) return unary[op];
      return binary[op];
    }

    function getProto(op, un){
      return getCtor(op, un).prototype;
    }

    function calcSpr(){
      var op = opsStack[opsStack.length - 1];
      var un = ustack[ustack.length - 1];

      return getSpr(op, un);
    }

    function getIpr(op, un){
      if(op === '(') return Infinity;
      if(op === ')') return -1;

      var proto = getProto(op, un);
      var priority = proto.priority();

      if(proto.group() === 1)
        priority += .5;

      return priority;
    }

    function getSpr(op, un){
      if(op === '(') return -2;

      if(op === ')')
        throw new SyntaxError('Token ")" is unexpected at this time');

      return getProto(op, un).priority();
    }
  }

  static sortAsc(arr){
    return arr.sort((expr1, expr2) => {
      return expr1.sortAsc(expr2);
    });
  }

  static sortDesc(arr){
    return arr.sort((expr1, expr2) => {
      return expr1.sortDesc(expr2);
    });
  }

  clone(){
    var ctor = this.constructor;
    var opnds = this.opnds.map(opnd => opnd.clone());
    var expr = new ctor(...opnds);

    return expr;
  }

  iterate(func){
    func(this);

    this.opnds.forEach(expr => {
      expr.iterate(func);
    });

    return this;
  }

  parts(sort, func){
    var parts = O.obj();

    this.iterate(expr => {
      if(!func || func(expr))
        parts[expr.str()] = expr;
    });

    parts = O.keys(parts).map(str => parts[str]);

    if(sort === 1) Expression.sortAsc(parts);
    else if(sort === 2) Expression.sortDesc(parts);

    return parts;
  }

  find(func){
    if(func(this)) return this;

    var {opnds} = this;
    var len = opnds.length;

    for(var i = 0; i < len; i++){
      var expr = opnds[i].find(func);
      if(expr !== null) return expr;
    }

    return null;
  }

  includes(str){
    if(str instanceof Expression) str = str.str();
    if(this.str() === str) return true;
    return this.opnds.some(expr => expr.includes(str));
  }

  replace(func){
    var {opnds} = this;
    
    opnds.forEach((expr, index) => {
      var newExpr = func(expr);

      if(newExpr) opnds[index] = newExpr;
      else expr.replace(func);
    });

    return this;
  }

  subst(expr1, expr2, clone){
    return this.replace(expr => {
      if(expr.eq(expr1)){
        if(clone) return expr2.clone();
        return expr2;
      }
    });
  }

  findDupe(){
    var exprs = new Set();

    return this.find(expr => {
      if(exprs.has(expr)) return true;
      exprs.add(expr);
    });
  }

  undupe(){
    var exprs = new Set();

    return this.replace(expr => {
      if(exprs.has(expr)) return expr.clone();
      exprs.add(expr);
    });
  }

  freeIdents(sort){
    return this.parts(sort, expr => {
      return expr.isLiteral();
    });
  }

  hasDupe(){
    return this.findDupe() !== null;
  }

  eq(expr){
    return this.str() === expr.str();
  }

  gt(expr){
    var s1 = this.str();
    var s2 = expr.str();

    if(s1.length > s2.length) return true;
    if(s1.length < s2.length) return false;
    return s1 > s2;
  }

  lt(expr){
    var s1 = this.str();
    var s2 = expr.str();
    
    if(s1.length < s2.length) return true;
    if(s1.length > s2.length) return false;
    return s1 < s2;
  }

  sortAsc(expr){
    var s1 = this.str();
    var s2 = expr.str();

    if(s1.length < s2.length) return -1;
    if(s1.length > s2.length) return 1;
    if(s1 < s2) return -1;
    if(s1 > s2) return 1;
    return 0;
  }

  sortDesc(expr){
    var s1 = this.str();
    var s2 = expr.str();

    if(s1.length > s2.length) return -1;
    if(s1.length < s2.length) return 1;
    if(s1 > s2) return -1;
    if(s1 < s2) return 1;
    return 0;
  }

  op(){ return null; }
  priority(){ return 0; }
  group(){ return 0; }

  isLiteral(){ return false; }
  isConst(){ return false; }
  isVar(){ return false; }
  isUnary(){ return false; }
  isBinary(){ return false; }

  str(){ return ''; }
  toString(){ return this.str(1); }
};

class Literal extends Expression{
  constructor(index, s){
    super([]);

    this.index = index;
    this.s = s;
  }

  static is(){ return false; }
  static from(){ return new Literal(0, ''); }

  clone(){
    var ctor = this.constructor;
    return new ctor(this.index);
  }

  isLiteral(){ return true; }
  str(){ return this.s; }
};

class Constant extends Literal{
  constructor(index){
    super(index, O.sfcc(CHAR_CODE_BASE_CONST + index));
  }

  static is(s){
    return /^[A-Z]$/.test(s);
  }

  static from(s){
    var index = O.cc(s) - CHAR_CODE_BASE_CONST;
    return new Constant(index);
  }

  isConst(){ return true; }
};

class Variable extends Literal{
  constructor(index){
    super(index, O.sfcc(CHAR_CODE_BASE_VAR + index));
  }

  static is(s){
    return /^[a-z]$/.test(s);
  }

  static from(s){
    var index = O.cc(s) - CHAR_CODE_BASE_VAR;
    return new Variable(index);
  }

  isVar(){ return true; }
};

class UnaryExpression extends Expression{
  constructor(opnd){
    super([opnd]);
  }

  isUnary(){
    return true;
  }

  str(space){
    return this.op() + this.opnds[0].str(space, this, 0);
  }
};

class BinaryExpression extends Expression{
  constructor(opnd1, opnd2){
    super([opnd1, opnd2]);
  }

  isBinary(){
    return true;
  }

  str(space, parent, index){
    var {opnds} = this;

    var s1 = opnds[0].str(space, this, 0);
    var s2 = opnds[1].str(space, this, 1);
    var op = this.op();
    var str;

    if(space) str = `${s1} ${op} ${s2}`;
    else str = `${s1}${op}${s2}`;

    if(parent){
      var parens = false;

      var pr1 = parent.priority();
      var pr2 = this.priority();

      if(pr2 < pr1){
        parens = true;
      }else if(pr2 === pr1){
        var left = parent.group() === 0;
        var first = index === 0;

        if(left !== first) parens = true;
      }

      if(parens) str = `(${str})`;
    }

    return str;
  }
};

module.exports = {
  Expression,
  Literal,
  Constant,
  Variable,
  UnaryExpression,
  BinaryExpression,
};