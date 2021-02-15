'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const debug = require('../debug');

class Base extends O.Stringifiable{
  *copy(deepCopy=null){ O.virtual('copy'); }
  *subst(expr1, expr2, deepCopy=null){ O.virtual('subst'); }
  *contains(expr, subst=0){ O.virtual('contains'); }
  *sort(deepCopy=null){ O.virtual('sort'); }
  *cmp(other){ O.virtual('cmp'); }
}

class System extends Base{
  rels = [];
  bindings = O.obj();

  constructor(rels=[]){
    super();
    
    this.addRels(rels);
  }

  get chNum(){ return this.len; }
  getCh(i){ return this.rels[i]; }

  get len(){ return this.rels.length; }

  *cmp(other){
    return this.len - other.len;
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

  *copy(deepCopy=null){
    if(deepCopy === null) return this;

    const sys = new System();

    for(const rel of this.rels)
      sys.addRel(yield [[rel, 'copy'], deepCopy || null]);

    return sys;
  }

  *subst(expr1, expr2, deepCopy=null){
    const sys = new System();

    for(const rel of this.rels)
      sys.addRel(yield [[rel, 'subst'], expr1, expr2, deepCopy]);

    return sys;
  }

  *contains(expr, subst=0){
    for(const rel of this.rels)
      if(yield [[rel, 'contains'], expr, subst])
        return 1;

    return 0;
  }

  *sort(deepCopy=null){
    const relsOld = this.rels;
    const relsNew = deepCopy !== null ? relsOld.slice() : relsOld;
    const len = relsNew.length;

    for(let i = 0; i !== len; i++){
      const rel = relsNew[i];
      relsNew[i] = yield [[rel, 'sort'], deepCopy];
    }

    for(let i = 0; i !== len; i++){
      for(let j = i + 1; j !== len; j++){
        const rel1 = relsNew[i];
        const rel2 = relsNew[j];

        if((yield [[rel1, 'cmp'], rel2]) > 0){
          relsNew[i] = rel2;
          relsNew[j] = rel1;
        }
      }
    }

    const sys = deepCopy !== null ? new System(relsNew) : this;

    return sys;
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

  get chNum(){ return 2; }

  getCh(i){
    if(i === 0) return this.lhs;
    if(i === 1) return this.rhs;
    assert.fail(i);
  }

  get type(){ O.virtual('type'); }
  get op(){ O.virtual('op'); }

  *cmp(other){
    return (
      (other.type - this.type) ||
      (yield [[this.lhs, 'cmp'], other.lhs]) ||
      (yield [[this.rhs, 'cmp'], other.rhs])
    );
  }

  *swap(deepCopy=null){
    const rel = yield [[this, 'copy'], deepCopy];
    const {lhs, rhs} = rel;

    rel.lhs = rhs;
    rel.rhs = lhs;

    return rel;
  }

  *copy(deepCopy=null){
    if(deepCopy === null) return this;

    return new this.constructor(
      yield [[this.lhs, 'copy'], deepCopy || null],
      yield [[this.rhs, 'copy'], deepCopy || null],
    );
  }

  *subst(expr1, expr2, deepCopy=null){
    return new this.constructor(
      yield [[this.lhs, 'subst'], expr1, expr2, deepCopy],
      yield [[this.rhs, 'subst'], expr1, expr2, deepCopy],
    );
  }

  *contains(expr, subst=0){
    return (
      (yield [[this.lhs, 'contains'], expr, subst]) ||
      (yield [[this.rhs, 'contains'], expr, subst])
    );
  }

  *sort(deepCopy=null){
    const {lhs, rhs} = this;
    const needsSwap = (yield [[lhs, 'cmp'], rhs]) > 0;

    if(needsSwap) yield O.tco([this, 'swap'], deepCopy);
    yield O.tco([this, 'copy'], deepCopy);
  }

  toStr(){
    return [this.lhs, ' ', this.op, ' ', this.rhs];
  }
}

class Equation extends Relation{
  get type(){ return 1; }
  get op(){ return '='; }
}

class Inequation extends Relation{
  get type(){ return 0; }
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

  get pri(){ O.virtual('pri'); }

  *cmp(other){ return this.pri - other.pri; }

  *eq(expr){
    if(expr.constructor !== this.constructor) return 0;

    const {chNum} = this;

    for(let i = 0; i !== chNum; i++)
      if(!(yield [[this.getCh(i), 'eq'], expr.getCh(i)]))
        return 0;

    return 1;
  }

  *contains(expr, subst=0){
    if(yield [[this, 'eq'], expr]) return 1;

    const {chNum} = this;

    for(let i = 0; i !== chNum; i++)
      if(yield [[this.getCh(i), 'contains'], expr, subst])
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

  get pri(){ return 3; }

  *copy(deepCopy=null){
    return this;
  }

  *subst(expr1, expr2, deepCopy=null){
    if(yield [[this, 'eq'], expr1])
      yield O.tco([expr2, 'copy'], deepCopy);

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

  get pri(){ return 0; }

  *eq(expr){
    return (
      expr.constructor === Identifier &&
      expr.name === this.name
    );
  }

  *copy(deepCopy=null){
    if(deepCopy === null) return this;
    return new Identifier(this.name);
  }

  *subst(expr1, expr2, deepCopy=null){
    if(yield [[this, 'eq'], expr1])
      yield O.tco([expr2, 'copy'], deepCopy);

    return this;
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

  get pri(){ return 2; }

  *copy(deepCopy=null){
    if(deepCopy === null) return this;

    return new Pair(
      yield [[this.fst, 'copy'], deepCopy || null],
      yield [[this.snd, 'copy'], deepCopy || null],
    );
  }

  *subst(expr1, expr2, deepCopy=null){
    if(yield [[this, 'eq'], expr1])
      yield O.tco([expr2, 'copy'], deepCopy);

    return new Pair(
      yield [[this.fst, 'subst'], expr1, expr2, deepCopy],
      yield [[this.snd, 'subst'], expr1, expr2, deepCopy],
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

  get pri(){ return 1; }

  *copy(deepCopy=null){
    if(deepCopy === null) return this;

    return new Substitution(
      yield [[this.target, 'copy'], deepCopy || null],
      yield [[this.pattern, 'copy'], deepCopy || null],
      yield [[this.replacement, 'copy'], deepCopy || null],
    );
  }

  *contains(expr, subst=0){
    if(subst) yield O.tco([this, 'contains', 1], expr, subst);
    yield O.tco([this, 'eq'], expr);
  }

  *subst(expr1, expr2, deepCopy=null){
    if(yield [[this, 'eq'], expr1])
      yield O.tco([expr2, 'copy'], deepCopy);

    return new Substitution(
      yield [[this.target, 'subst'], expr1, expr2, deepCopy],
      yield [[this.pattern, 'subst'], expr1, expr2, deepCopy],
      yield [[this.replacement, 'subst'], expr1, expr2, deepCopy],
    );
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