'use strict';

const O = require('../framework');
const debug = require('../debug');

const DEBUG = 0;

const PRIORITY_MAX = (1 << 15) - 1;

class Expression{
  constructor(){}

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

    if(literals.length === 0)
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
      if(op === '(') return PRIORITY_MAX;
      if(op === ')') return 1;

      var proto = getProto(op, un);
      var priority = proto.priority();

      if(proto.group() === 1)
        priority++;

      return priority;
    }

    function getSpr(op, un){
      if(op === '(') return 0;

      if(op === ')')
        throw new SyntaxError('Token ")" is unexpected at this time');

      return getProto(op, un).priority();
    }
  }

  static findSubsts(eqs){
    if(eqs.length === 0) return null;

    var varsObj = O.obj();
    var varCtor = null;

    eqs = eqs.map(eq => {
      return eq.map(expr => {
        expr = expr.clone();

        expr.getVars().forEach(vari => {
          if(varCtor === null)
            varCtor = vari.constructor;

          varsObj[vari.index] = null;
        });

        return expr;
      });
    });

    if(varCtor === null){
      if(eqs.every(eq => eq[0].eq(eq[1]))) return [];
      else return null;
    }

    var varsIndices = O.keys(varsObj).map(index => index | 0)
    var varsArr = varsIndices.map(index => new varCtor(index));
    var candidates = O.obj();
    var upd = eqs.length + 1;

    varsIndices.forEach(index => candidates[index] = null);

    while(eqs.length !== 0 && upd){
      for(var i = 0; i !== eqs.length && upd !== 0; i++, upd--){
        if(DEBUG) logEqs(i);

        var eq = eqs[i];
        var [lhs, rhs] = eq;
        var temp;

        if(lhs.eq(rhs)){
          splice(i, 1);
          continue;
        }

        var isDupe = eqs.some((eq, j) => {
          if(i === j) return false;

          var [left, right] = eq;

          if(left.eq(lhs) && right.eq(rhs)) return true;
          if(left.eq(rhs) && right.eq(lhs)) return true;

          return false;
        });

        if(isDupe){
          splice(i, 1);
          continue;
        }

        if(lhs.isConst() || rhs.isConst()){
          if(!lhs.isConst()) temp = lhs, lhs = rhs, rhs = temp;

          if(rhs.isConst()){
            if(lhs.eq(rhs)){
              splice(i, 1);
              continue;
            }else{
              return null;
            }
          }else if(rhs.isOp()){
            return null;
          }
        }

        if(lhs.isVar() || rhs.isVar()){
          if(!lhs.isVar()) temp = lhs, lhs = rhs, rhs = temp;

          var index = lhs.index;
          var rhsVars = rhs.getVars();

          if(rhsVars.length === 0){
            if(varsObj[index] === null){
              varsObj[index] = rhs;
              replace(index, rhs);
              splice(i, 1);
              continue;
            }else{
              return null;
            }
          }else if(rhsVars.some(vari => vari.eq(lhs))){
            return null;
          }else if(rhs.eq(lhs)){
            splice(i, 1);
            continue;
          }

          var candidate = candidates[index];

          if(candidate === null){
            candidates[index] = candidates[index] = rhs;
          }else if(!rhs.eq(candidate)){
            if(eq[0].isVar()) eq[0] = candidate;
            else eq[1] = candidate;
            update();
          }
        }

        if(lhs.isOp() && rhs.isOp()){
          if(lhs.constructor === rhs.constructor){
            var newEqs = lhs.opnds.map((expr, index) => {
              return [expr, rhs.opnds[index]];
            });

            splice(i, 1, ...newEqs);
            continue;
          }else{
            return null;
          }
        }
      }
    }

    if(eqs.length !== 0){
      if(DEBUG) log(`${'='.repeat(50)}\n`);

      eqs.forEach(eq => {
        if(!eq[0].isVar())
          eq.reverse();
      });

      var n = eqs.length;

      for(var i = 0; i !== n; i++){
        if(DEBUG) logEqs(i);

        var eq = eqs[i];
        var [vari, rhs] = eq;
        var vars = rhs.getVars();

        for(var j = 0; j !== n; j++){
          if(j === i) continue;

          var eq2 = eqs[j];
          var [vari2, rhs2] = eq2;

          if(!rhs2.includes(vari)) continue;
          if(vari2.in(vars)) return null;

          eq2[1] = rhs2.subst(vari, rhs, 1);
        }
      }

      if(DEBUG) logEqs();

      eqs.forEach(([vari, rhs]) => {
        varsObj[vari.index] = rhs;
      });
    }

    varsIndices = varsIndices.filter(index => {
      return varsObj[index] !== null
    });

    var substs = new Map();

    varsIndices.forEach(index => {
      substs.set(new varCtor(index).str(), varsObj[index]);
    });

    return substs;

    function splice(...args){
      eqs.splice(...args);
      update();
    }

    function update(){
      i--;
      upd = eqs.length + 1;
    }

    function replace(index, expr){
      var vari = new varCtor(index);

      eqs.forEach(eq => {
        eq.forEach((e, i) => {
          eq[i] = e.subst(vari, expr, 1);
        });
      });
    }

    function logEqs(i=null){
      var str = eqs.map((eq, j) => {
        var curr = i === j ? ' <---' : '';
        return eq.join(' = ') + curr;
      }).join('\n')

      debug(str);
    }
  }

  static combine(eqs){
    if(eqs.length === 0) return null;

    var substs = Expression.findSubsts(eqs);
    if(substs === null) return null;

    return eqs[0][0].clone().substM(substs, 1);
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

  iterate(func){
    func(this);

    if(this.isOp()){
      this.opnds.forEach(expr => {
        expr.iterate(func);
      });
    }

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

    if(this.isOp()){
      var {opnds} = this;
      var len = opnds.length;

      for(var i = 0; i < len; i++){
        var expr = opnds[i].find(func);
        if(expr !== null) return expr;
      }
    }

    return null;
  }

  includes(str){
    if(str instanceof Expression) str = str.str();
    if(this.str() === str) return true;
    return this.isOp() && this.opnds.some(expr => expr.includes(str));
  }

  replace(func){
    var expr = func(this);
    if(expr) return expr;

    if(this.isOp()){
      var {opnds} = this;
      
      opnds.forEach((expr, index) => {
        var newExpr = func(expr);

        if(newExpr) opnds[index] = newExpr;
        else expr.replace(func);
      });
    }

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

  substM(substs, clone){
    return this.replace(expr => {
      var newExpr = substs.get(expr.str());

      if(newExpr){
        if(clone) return newExpr.clone();
        return newExpr;
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

  getConsts(sort){
    return this.parts(sort, expr => {
      return expr.isConst ();
    });
  }

  getVars(sort){
    return this.parts(sort, expr => {
      return expr.isVar();
    });
  }

  hasDupe(){
    return this.findDupe() !== null;
  }

  sameCtor(expr){
    return this.constructor === expr.constructor;
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

  in(arr){
    return arr.some(expr => expr.eq(this));
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

  clone(){
    throw new TypeError('Cannot clone instance of abstract class "Expression"');
  }

  isLiteral(){ return false; }
  isConst(){ return false; }
  isVar(){ return false; }

  isOp(){ return false; }
  isUnary(){ return false; }
  isBinary(){ return false; }

  isMeta(){ return false; }

  str(){ return ''; }
  toString(){ return this.str(1); }
};

class Literal extends Expression{
  constructor(index, s){
    super();

    this.index = index;
    this.s = s;
  }

  clone(){
    var ctor = this.constructor;
    return new ctor(this.index);
  }

  isLiteral(){ return true; }
  str(){ return this.s; }
};

class Constant extends Literal{
  constructor(index, s){
    super(index, s);
  }

  isConst(){ return true; }
};

class Variable extends Literal{
  constructor(index, s){
    super(index, s);
  }

  isVar(){ return true; }
};

class Operation extends Expression{
  constructor(opnds){
    super();

    this.opnds = opnds;
  }

  clone(){
    var ctor = this.constructor;
    var opnds = this.opnds.map(opnd => opnd.clone());
    var expr = new ctor(...opnds);

    return expr;
  }

  isOp(){ return true; }
  op(){ return null; }
  priority(){ return 0; }
  group(){ return 0; }

  forceParens(){ return false; }
  isMeta(){ return false; }
};

class UnaryOperation extends Operation{
  constructor(opnd){
    super([opnd]);
  }

  isUnary(){ return true; }

  str(space, parent){
    var str = `${this.op()}${this.opnds[0].str(space, this, 0)}`;

    if(parent){
      if(this.forceParens() && this.sameCtor(parent))
        str = `(${str})`;
    }

    return str;
  }
};

class BinaryOperation extends Operation{
  constructor(opnd1, opnd2){
    super([opnd1, opnd2]);
  }

  isBinary(){ return true; }
  space(){ return ' '; }

  str(space, parent, index){
    var {opnds} = this;

    var s1 = opnds[0].str(space, this, 0);
    var s2 = opnds[1].str(space, this, 1);
    var op = this.op();
    var sp = this.space();
    var str;

    if(space) str = `${s1}${sp}${op}${sp}${s2}`;
    else str = `${s1}${op}${s2}`;

    if(parent){
      var parens = false;

      var pr1 = parent.priority();
      var pr2 = this.priority();

      if(pr2 < pr1){
        parens = true;
      }else if(pr2 === pr1){
        if(this.forceParens() && this.sameCtor(parent)){
          parens = true;
        }else{
          var left = parent.group() === 0;
          var first = index === 0;

          if(left !== first) parens = true;
        }
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
  Operation,
  UnaryOperation,
  BinaryOperation,
};