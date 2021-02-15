'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Base extends O.Stringifiable{
  *copy(deep=0){ O.virtual('copy'); }
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

  *copy(deep=0){
    const sys = new System();

    for(const rel of this)
      sys.addRel(deep ? yield [[rel, 'copy'], deep] : rel);

    return sys;
  }

  *[Symbol.iterator](){
    yield* this.rels;
  }

  toStr(){
    return this.join([], this.rels, '\n');
  }
}

class Relation extends Base{
  constructor(lhs, rhs){
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }

  get op(){ O.virtual('op'); }

  *copy(deep=0){
    return new this.constructor(
      deep ? yield [[this.lhs, 'copy'], deep] : this.lhs,
      deep ? yield [[this.rhs, 'copy'], deep] : this.rhs,
    );
  }

  swap(copy=null){
    const rel = copy !== null ? O.rec([this, 'copy'], copy) : this;
    const {lhs, rhs} = rel;

    rel.lhs = rhs;
    rel.rhs = lhs;

    return rel;
  }

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

  *contains(expr){
    if(yield [[this, 'eq'], expr]) return 1;

    const {chNum} = this;

    for(let i = 0; i !== chNum; i++)
      if(yield [[this.getCh(i), 'contains'], expr])
        return 1;

    return 0;
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

  *copy(deep=0){
    return this;
  }

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

  *copy(deep=0){
    return new Identifier(this.name);
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

  *copy(deep=0){
    return new Pair(
      deep ? yield [[this.fst, 'copy'], deep] : this.fst,
      deep ? yield [[this.snd, 'copy'], deep] : this.snd,
    );
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

  *copy(deep=0){
    return new Substitution(
      deep ? yield [[this.target, 'copy'], deep] : this.target,
      deep ? yield [[this.pattern, 'copy'], deep] : this.pattern,
      deep ? yield [[this.replacement, 'copy'], deep] : this.replacement,
    );
  }

  *contains(expr){
    yield O.tco([this, 'eq'], expr);
  }

  toStr(){
    return ['[',
      this.target, ' ',
      this.pattern, ' ',
      this.replacement, ']',
    ];
  }
}

module.exports = {
  Base,
  System,
  Relation,
  Equation,
  Inequation,
  Expression,
  Term,
  Identifier,
  Pair,
  Substitution,
};