'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

const TAB_SIZE = 2;

const TAB = ' '.repeat(TAB_SIZE);

const probs = {
  func: .1,
  expr: .1,
};

module.exports = gen;

class Function{
  constructor(indent, ident, body){
    this.indent = indent;
    this.ident = ident;
    this.body = body;
  }

  toString(){
    return `(${this.ident} => {\n${this.body}\n${TAB.repeat(this.indent)}})`;
  }
};

class Body{
  constructor(lines){
    this.lines = lines;
  }

  toString(){
    return this.lines.join('\n');
  }
};

class Line{
  constructor(indent, target=null, expr, ret=0, isNew=0){
    this.indent = indent;
    this.target = target;
    this.expr = expr;
    this.ret = ret;
    this.isNew = isNew;
  }

  toString(){
    var str = TAB.repeat(this.indent);
    if(this.ret) str += `return `;
    else if(this.isNew) str += 'var ';
    if(this.target) str += `${this.target} = `;
    return `${str}${this.expr};`;
  }
};

class Expression{
  constructor(chain){
    this.chain = chain;
  }

  toString(){
    return this.chain.map((elem, index) => {
      if(index === 0) return elem;
      return `(${elem})`;
    }).join('');
  }
};

class Identifier{
  constructor(name){
    this.name = name;
  }

  toString(){
    return this.name;
  }
};

function gen(builtins){
  var bsObj = O.obj();
  builtins.forEach(bi => bsObj[bi] = 1);

  var state = {
    idents: [...builtins].reverse(),
    indent: 0,
    depth: 0,
  };

  global.zz = 0;

  return genBody(state, 0);

  function genBody(state, isFunc=0){
    state = {...state};
    if(isFunc) state.indent++;

    var lines = [];

    do{
      var target = null;
      var isNew = 0;

      if(state.idents.length !== builtins.length && rand(2)){
        target = genTarget(state);
        isNew = !state.idents.includes(target);
      }

      var expr = genExpr(state, isFunc && !isNew ? 1 : 2);
      var line = new Line(state.indent, target, expr, 0, isNew);

      lines.push(line);
      if(target !== null) updateIdents(state, target);

      if(expr.chain.length === 1) break;
    }while(global.zz++ < 1e6 && (isNew || rand(2)));

    if(isFunc)
      O.last(lines).ret = 1;

    return new Body(lines, isFunc);
  }

  function genTarget(state){
    var idents = state.idents.slice();

    for(var i = 0; i !== idents.length; i++)
      if(rand(2)) break;

    idents.splice(i, 0, identName(idents.length));

    do{
      var ident = randElem(idents);
    }while(global.zz++ < 1e6 && (ident in bsObj));

    return ident;
  }

  function genExpr(state, minLen=1){
    state = {...state};
    if(minLen === 2) state.depth++;

    var chain = [];

    do{
      if(rand(2) === 0){
        var ident = randElem(state.idents);
        updateIdents(state, ident);
        chain.push(new Identifier(ident));
        continue;
      }

      if(chain.length !== 0 && rand(2) === 0){
        if(randf(state.depth * (1 - probs.expr)) < 1)
          chain.push(genExpr(state, 2));
        continue;
      }

      if(randf(state.indent * (1 - probs.func)) < 1)
        chain.push(genFunc(state));
    }while(global.zz++ < 1e6 && (chain.length < minLen || rand(2)));

    return new Expression(chain);
  }

  function genFunc(state){
    state = {...state};
    state.idents = state.idents.slice();

    var ident = identName(state.idents.length);
    state.idents.unshift(ident);

    var body = genBody(state, 1);
    return new Function(state.indent, ident, body);
  }

  function updateIdents(state, target){
    var idents = state.idents;
    var index = idents.indexOf(target);

    idents.splice(index, 1);
    idents.splice(index >> 1, 0, target);
  }

  function identName(index){
    index -= builtins.length;

    var i = index % 26;
    var j = index / 26 | 0;

    var str = O.sfcc(O.cc('a') + i);
    if(j !== 0) str += j;

    return str;
  }
}

function randElem(arr){
  var i = 0;
  var len = arr.length;

  while(global.zz++ < 1e6 && (len !== 1)){
    var len1 = (len >> 1) | (len & 1);

    if(rand(3) !== 2){
      len = len1;
    }else{
      i += len1;
      len >>= 1;
    }
  }

  return arr[i];
}

function rand(a){
  return O.rand(a);
}

function randf(a){
  return O.randf(a);
}