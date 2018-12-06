'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

const types = O.enum([
  'STRING',
  'REGEX',
  'TRANSFORM',
  'PARENS',
  'IDENT',
]);

module.exports = {
  desugarize,
};

function desugarize(rules, src){
  rules = parseRules(rules);
  src = src.toString();

  return Buffer.from(src);
}

function parseRules(rules){
  rules = O.sanl(rules.toString()).map(line => {
    var matches = [];

    while(line.length !== 0){
      var m = null;
      var type = null;

      do{
        type = types.STRING;
        m = line.match(/^"(?:\\.|[^"])*"/s);
        if(m !== null) break;

        type = types.REGEX;
        m = line.match(/^\/(?:\\.|[^\/])*\//s);
        if(m !== null) break;

        type = types.IDENT;
        m = line.match(/^[a-zA-Z0-9]+/);
        if(m !== null) break;

        type = types.TRANSFORM;
        m = line.match(/^->/);
        if(m !== null) break;

        type = types.PARENS;
        m = line.match(/^-/);
        if(m !== null) break;

        line = line.slice(1);
      }while(line.length !== 0);

      if(m === null) continue;

      m = m[0];
      line = line.slice(m.length);
      matches.push([type, m]);
    }
  });
}

function evaluate(val){
  var code = `return ${val}`;
  return new Function(code)();
}

class Rule{
  constructor(){}

  isAtomic(){ return 0; }
  isParen(){ return 0; }
};

class AtomicRule extends Rule{
  constructor(){}

  isAtomic(){ return 1; }
};