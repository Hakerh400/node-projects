'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Base extends O.Stringifiable{}

class Expression extends Base{
  #idents = O.obj();

  hasIdent(ident){
    assert(typeof ident === 'string');
    return O.has(this.#idents, ident);
  }

  getIdent(ident){
    assert(this.hasIdent(ident));
    return this.#idents[ident];
  }

  addIdent(ident, type=1){
    if(!this.hasIdent(ident)){
      this.#idents[ident] = type;
      return;
    }

    this.#idents[ident] |= type;
    return this;
  }

  get idents(){
    return O.kvPairs(this.#idents);
  }

  inheritIdents(expr, type=1){
    for(const [name, t] of expr.idents)
      this.addIdent(name, t & type);

    return this;
  }

  *eq(expr){
    if(expr.constructor !== this.constructor) return 0;

    const {chNum} = this;

    for(let i = 0; i !== chNum; i++)
      if(!(yield [[this.getCh(i), 'eq'], expr.getCh(i)]))
        return 0;

    return 1;
  }
}

class Term extends Expression{
  static #kCtor = Symbol();
  static term = new Term(Term.#kCtor);

  constructor(kCtor){
    assert(kCtor === Term.#kCtor);
    super();
  }

  get chNum(){ return 0; }

  toStr(){
    return '.';
  }
}

class Identifier extends Expression{
  constructor(name){
    super();

    this.name = name;
    this.addIdent(name);
  }

  get chNum(){ return 0; }

  *eq(expr){
    return (
      expr.constructor === Identifier &&
      expr.name === this.name
    );
  }

  toStr(){
    return this.name;
  }
}

class Pair extends Expression{
  constructor(fst, snd){
    super();

    this.fst = fst;
    this.snd = snd;

    this.inheritIdents(fst);
    this.inheritIdents(snd);
  }

  get chNum(){ return 2; }

  getCh(i){
    if(i === 0) return this.fst;
    if(i === 1) return this.snd;
    assert.fail(i);
  }

  toStr(){
    return ['(', this.fst, ' ', this.snd, ')'];
  }
}

class Substitution extends Expression{
  constructor(target, pattern, replacement){
    super();

    this.target = target;
    this.pattern = pattern;
    this.replacement = replacement;

    this.inheritIdents(target, 0);
    this.inheritIdents(pattern, 0);
    this.inheritIdents(replacement, 0);
  }

  get chNum(){ return 2; }
  
  getCh(i){
    if(i === 0) return this.target;
    if(i === 1) return this.pattern;
    if(i === 2) return this.replacement;
    assert.fail(i);
  }

  toStr(){
    return ['[',
      this.target, ' ',
      this.pattern, ' ',
      this.replacement, ']',
    ];
  }
}

class Relation extends Base{
  constructor(lhs, rhs){
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }

  get op(){ O.virtual('op'); }

  toStr(){
    return [this.lhs, ' ', this.op, ' ', this.rhs];
  }
}

class Equation extends Relation{
  get op(){ return '='; }
}

class Inequation extends Relation{
  get op(){ return '!='; }
}

class System extends Base{
  rels = [];
  bindings = O.obj();

  constructor(rels=[]){
    super();
    
    this.addRels(rels);
  }

  addRels(rels){
    for(const rel of rels)
      this.addRel(rel);

    return this;
  }

  addRel(rel){
    this.rels.push(rel);
    return this;
  }

  toStr(){
    return this.join([], this.rels, '\n');
  }
}

module.exports = {
  Base,
  Expression,
  Term,
  Identifier,
  Pair,
  Substitution,
  Relation,
  Equation,
  Inequation,
  System,
};