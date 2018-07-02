'use strict';

const O = require('../framework');

const CHAR_CODE_BASE = 'A'.charCodeAt(0);

class Expression{
  constructor(opnds){
    this.opnds = opnds;
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

  iter(func){
    func(this);

    this.opnds.forEach(expr => {
      expr.iter(func);
    });

    return this;
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

  parts(sort, func){
    var parts = O.obj();

    this.iter(expr => {
      if(!func || func(expr))
        parts[expr.str()] = expr;
    });

    parts = O.keys(parts).map(str => parts[str]);

    if(sort === 1) Expression.sortAsc(parts);
    else if(sort === 2) Expression.sortDesc(parts);

    return parts;
  }

  freeIdents(sort){
    return this.parts(sort, expr => {
      return expr.isIdent();
    });
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
  isIdent(){ return false; }

  toString(){
    return this.str(1);
  }
};

class Identifier extends Expression{
  constructor(index){
    super([]);

    this.index = index;
    this.char = String.fromCharCode(CHAR_CODE_BASE + index);
  }

  clone(){
    return new Identifier(this.index);
  }

  isIdent(){
    return true;
  }

  str(){
    return this.char;
  }
};

class UnaryExpression extends Expression{
  constructor(opnd){
    super([opnd]);
  }

  str(space){
    return this.op() + this.opnds[0].str(space, this, 0);
  }
};

class BinaryExpression extends Expression{
  constructor(opnd1, opnd2){
    super([opnd1, opnd2]);
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
  Identifier,
  UnaryExpression,
  BinaryExpression,
};