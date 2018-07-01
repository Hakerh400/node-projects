'use strict';

var O = require('../framework');

const CHAR_CODE_BASE = 'A'.charCodeAt(0);
const SPACE = 1;

module.exports = {
  genExpr,
};

function genExpr(identsNum=1){
  var availableOps = [Negation, Conjunction, Disjunction, Implication];
  var idents = O.ca(identsNum, i => new Identifier(i));
  var nextedLevel = 0;

  var randIdent = () => O.randElem(idents);
  var randOp = () => O.randElem(availableOps);

  var genOpnds = () => {
    if(O.rand(nextedLevel + 1) !== 0)
      return randIdent();

    nextedLevel++;
    var expr = genExpr();
    nextedLevel--;

    return expr;
  };

  var genExpr = () => {
    return new (randOp())(genOpnds);
  };

  do{
    var expr = genExpr();
    expr.isStat = true;

    var n = 1 << identsNum;
    var truthy = true;

    for(var i = 0; i !== n; i++){
      var j = i;

      idents.forEach(ident => {
        ident.val = j & 1;
        j >>= 1;
      });

      if(!expr.eval()){
        truthy = false;
        break;
      }
    }
  }while(!truthy);

  return expr;
}

class Expression{
  constructor(type, op, opndsNum, func=null, isStat=false, isIdent=false){
    this.type = type;
    this.op = op;
    this.opndsNum = opndsNum;

    this.isStat = isStat;
    this.isIdent = isIdent;

    if(func === null) func = () => null;
    this.opnds = O.ca(opndsNum, func);
  }

  getIdents(){
    var idents = new Set();

    this.iterate(expr => {
      if(!expr.isIdent) return;
      if(idents.has(expr)) return;
      idents.add(expr);
    });

    return [...idents];
  }

  iterate(func){
    func(this);
    this.opnds.forEach(expr => expr.iterate(func));
  }

  isUnary(){
    return this.opndsNum === 1;
  }

  isBinary(){
    return this.opndsNum === 2;
  }

  hasParens(){
    return !this.isStat && this.isBinary();
  }

  str(op){
    var {op, opnds} = this;

    var s1 = opnds[0].toString();
    if(this.isUnary())
      return `${op}${s1}`;

    var s2 = opnds[1].toString();
    if(SPACE) return `${s1} ${op} ${s2}`;
    return `${s1}${op}${s2}`;
  }

  toString(){
    var str = this.str();
    if(this.hasParens()) str = `(${str})`;
    return str;
  }
};

class Identifier extends Expression{
  constructor(id, val=0){
    super(0, null, 0, null, false, true);

    this.id = id;
    this.val = val;
  }

  eval(){
    return this.val;
  }

  toString(){
    return String.fromCharCode(CHAR_CODE_BASE + this.id);
  }
};

class Negation extends Expression{
  constructor(func){
    super(1, '¬', 1, func);
  }

  eval(){
    var {opnds} = this;
    return !opnds[0].eval() | 0;
  }
};

class Conjunction extends Expression{
  constructor(func){
    super(2, '∧', 2, func);
  }

  eval(){
    var {opnds} = this;
    return opnds[0].eval() & opnds[1].eval();
  }
};

class Disjunction extends Expression{
  constructor(func){
    super(3, '∨', 2, func);
  }

  eval(){
    var {opnds} = this;
    return opnds[0].eval() | opnds[1].eval();
  }
};

class Implication extends Expression{
  constructor(func){
    super(4, '→', 2, func);
  }

  eval(){
    var {opnds} = this;
    return !opnds[0].eval() | opnds[1].eval();
  }
};