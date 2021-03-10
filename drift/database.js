'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Info = require('./info');

class Database{
  table = [];

  syms = O.obj();
  pairs = O.obj();

  getInfo(expr){
    if(isSym(expr)){
      const {syms} = this;
      const sym = expr;

      if(O.has(syms, sym))
        return syms[sym];

      const info = this.infoFromExpr(expr);
      return syms[sym] = info;
    }

    const {pairs} = this;
    const [fst, snd] = expr;

    if(O.has(pairs, fst)){
      if(O.has(pairs[fst], snd))
        return pairs[fst][snd];
    }else{
      pairs[fst] = O.obj();
    }

    const info = this.infoFromExpr(expr);
    return pairs[fst][snd] = info;
  }

  infoFromExpr(expr){
    const {table} = this;
    const index = table.length;
    const info = new Info();

    info.index = index;
    info.expr = expr;

    if(isSym(expr)){
      const sym = expr;

      info.baseSym = sym;
      info.argsNum = 0;
    }else{
      const [fst, snd] = expr;

      info.baseSym = fst.baseSym;
      info.argsNum = fst.argsNum + 1;

      fst.refs.push(index);
      if(fst !== snd) snd.refs.push(index);
    }

    table.push(info);

    return info;
  }
}

const isSym = expr => {
  return typeof expr === 'symbol';
};

const isPair = expr => {
  return typeof expr === 'object';
};

module.exports = Object.assign(Database, {
  isSym,
  isPair,
});