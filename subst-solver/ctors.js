'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const debug = require('../debug');

class Base extends O.Stringifiable{
  *copy(deepCopy=null){ O.virtual('copy'); }
  *subst(expr1, expr2, deepCopy=null){ O.virtual('subst'); }
  *substIdents(expr, deepCopy=null){ O.virtual('substIdents'); }
  *contains(expr, subst=0){ O.virtual('contains'); }
  *sort(deepCopy=null){ O.virtual('sort'); }
  *cmp(other){ O.virtual('cmp'); }
  *getIdents(obj=O.obj()){ O.virtual('getIdents'); }
  *simplify(){ O.virtual('simplify'); }
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
  get empty(){ return this.rels.length === 0; }
  get nempty(){ return this.rels.length !== 0; }

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

  *substIdents(expr, deepCopy=null){
    const sys = new System();

    for(const rel of this.rels)
      sys.addRel(yield [[rel, 'substIdents'], expr, deepCopy]);

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

    yield [[this, 'sortRels'], relsNew, deepCopy];

    const sys = deepCopy !== null ? new System(relsNew) : this;

    return sys;
  }

  *sortRels(rels, deepCopy=null){
    const len = rels.length;

    for(let i = 0; i !== len; i++){
      const rel = rels[i];
      rels[i] = yield [[rel, 'sort'], deepCopy];
    }

    for(let i = 0; i !== len; i++){
      for(let j = i + 1; j !== len; j++){
        const rel1 = rels[i];
        const rel2 = rels[j];

        if((yield [[rel1, 'cmp'], rel2]) > 0){
          rels[i] = rel2;
          rels[j] = rel1;
        }
      }
    }

    return rels;
  }

  *cmp(other){
    return this.len - other.len;
  }

  *getIdents(obj=O.obj()){
    for(const rel of this.rels)
      yield [[rel, 'getIdents'], obj];

    return obj;
  }

  *simplify(){
    const rels = [];

    for(const rel of this.rels)
      rels.push(yield [[rel, 'simplify']]);

    yield [[this, 'sortRels'], rels];

    for(let i = 0; i !== rels.length; i++){
      const rel = rels[i];
      const {type, lhs, rhs} = rel;

      O.z=1
      const eqMaybe = yield [[lhs, 'eqMaybe'], rhs];

      if(eqMaybe !== null){
        if(eqMaybe ^ type)
          return null;

        rels.splice(i--, 1);
        continue;
      }
    }

    return new System(rels);
  }

  toStr(){
    return this.join([], this.rels, '\n');
  }
}

class Solution extends Base{
  constructor(bindings){
    super();
    this.bindings = bindings;
  }

  toStr(){
    const {bindings} = this;
    const arr = [];

    const idents = O.sortAsc(O.keys(bindings));

    for(let i = 0; i !== idents.length; i++){
      const ident = idents[i];
      if(i !== 0) arr.push('\n');
      arr.push(ident, ' = ', bindings[ident]);
    }

    return arr;
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
      (
        (yield [[this.rhs, 'contains'], this.lhs, 1]) -
        (yield [[other.rhs, 'contains'], other.lhs, 1])
      ) ||
      (yield [[this.lhs, 'cmp2'], other.lhs]) ||
      (yield [[this.rhs, 'cmp2'], other.rhs])
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

  *substIdents(expr, deepCopy=null){
    return new this.constructor(
      yield [[this.lhs, 'substIdents'], expr, deepCopy],
      yield [[this.rhs, 'substIdents'], expr, deepCopy],
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

  *getIdents(obj=O.obj()){
    yield [[this.lhs, 'getIdents'], obj];
    yield [[this.rhs, 'getIdents'], obj];
    return obj;
  }

  *simplify(){
    return new this.constructor(
      yield [[this.lhs, 'simplify']],
      yield [[this.rhs, 'simplify']],
    );
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
  get isTerm(){ return 0; }
  get isIdent(){ return 0; }
  get isPair(){ return 0; }
  get isSubst(){ return 0; }
  get isStruct(){ return 0; }

  get pri(){ O.virtual('pri'); }
  get pri2(){ O.virtual('pri2'); }

  *cmp(other){ return this.pri - other.pri; }
  *cmp2(other){ return this.pri2 - other.pri2; }

  *eq(expr){
    if(expr.constructor !== this.constructor) return 0;

    const {chNum} = this;

    for(let i = 0; i !== chNum; i++)
      if(!(yield [[this.getCh(i), 'eq'], expr.getCh(i)]))
        return 0;

    return 1;
  }

  *eqStruct(expr){
    if(yield [[this, 'eq'], expr])
      return 1;

    if(!(this.isStruct && expr.isStruct))
      return null;

    const ctor1 = this.constructor;
    const ctor2 = expr.constructor;

    if(ctor1 !== ctor2)
      return 0;

    assert(ctor1 === Pair);
    assert(ctor2 === Pair);

    const result1 = yield [[this.fst, 'eqStruct'], expr.fst];
    const result2 = yield [[this.snd, 'eqStruct'], expr.snd];

    if(result1 !== null && !result1) return 0;
    if(result2 !== null && !result2) return 0;

    if(result1 === null) return null;
    if(result2 === null) return null;

    assert(result1);
    assert(result2);

    return 1;
  }

  *eqMaybe(expr){
    if(yield [[this, 'eq'], expr])
      return 1;

    if(yield [[this, 'contains'], expr])
      return 0;

    if(yield [[expr, 'contains'], this])
      return 0;

    yield O.tco([this, 'eqStruct'], expr);
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

  get isTerm(){ return 1; }
  get isStruct(){ return 1; }

  get pri(){ return 3; }
  get pri2(){ return 0; }

  *copy(deepCopy=null){
    return this;
  }

  *subst(expr1, expr2, deepCopy=null){
    if(yield [[this, 'eq'], expr1])
      yield O.tco([expr2, 'copy'], deepCopy);

    return this;
  }

  *substIdents(expr, deepCopy=null){
    return this;
  }

  *getIdents(obj=O.obj()){
    return obj;
  }

  *simplify(){
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
  }

  get chNum(){ return 0; }

  get isIdent(){ return 1; }

  get pri(){ return 0; }
  get pri2(){ return 2; }

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

  *substIdents(expr, deepCopy=null){
    yield O.tco([expr, 'copy'], deepCopy);
  }

  *getIdents(obj=O.obj()){
    obj[this.name] = 1;
    return obj;
  }

  *simplify(){
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
  }

  get chNum(){ return 2; }

  getCh(i){
    if(i === 0) return this.fst;
    if(i === 1) return this.snd;
    assert.fail(i);
  }

  get isPair(){ return 1; }
  get isStruct(){ return 1; }

  get pri(){ return 2; }
  get pri2(){ return 1; }

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

  *substIdents(expr, deepCopy=null){
    return new Pair(
      yield [[this.fst, 'substIdents'], expr, deepCopy],
      yield [[this.snd, 'substIdents'], expr, deepCopy],
    );
  }

  *getIdents(obj=O.obj()){
    yield [[this.fst, 'getIdents'], obj];
    yield [[this.snd, 'getIdents'], obj];
    return obj;
  }

  *simplify(){
    return new Pair(
      yield [[this.fst, 'simplify']],
      yield [[this.snd, 'simplify']],
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
  }

  get chNum(){ return 3; }
  
  getCh(i){
    if(i === 0) return this.target;
    if(i === 1) return this.pattern;
    if(i === 2) return this.replacement;
    assert.fail(i);
  }

  get isSubst(){ return 1; }

  get pri(){ return 1; }
  get pri2(){ return 3; }

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

  *substIdents(expr, deepCopy=null){
    return new Substitution(
      yield [[this.target, 'substIdents'], expr, deepCopy],
      yield [[this.pattern, 'substIdents'], expr, deepCopy],
      yield [[this.replacement, 'substIdents'], expr, deepCopy],
    );
  }

  *getIdents(obj=O.obj()){
    yield [[this.target, 'getIdents'], obj];
    yield [[this.pattern, 'getIdents'], obj];
    yield [[this.replacement, 'getIdents'], obj];
    return obj;
  }

  *simplify(){
    const target = yield [[this.target, 'simplify']];
    const pattern = yield [[this.pattern, 'simplify']];
    const replacement = yield [[this.replacement, 'simplify']];

    if(yield [[pattern, 'eq'], replacement])
      return target;

    const result = yield [[target, 'eqMaybe'], pattern];

    if(result === null)
      return new Substitution(target, pattern, replacement);

    if(result)
      return replacement;

    if(!target.isStruct)
      return new Substitution(target, pattern, replacement);

    const ctor = target.constructor;

    if(ctor === Term)
      return target;

    assert(ctor === Pair);

    return new Pair(
      yield [[new Substitution(target.fst, pattern, replacement), 'simplify']],
      yield [[new Substitution(target.snd, pattern, replacement), 'simplify']],
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

const {term} = Term;

module.exports = {
  term,

  Base,
  System,
  Solution,
  Relation,
  Equation,
  Inequation,
  Expression,
  Term,
  Identifier,
  Pair,
  Substitution,
};