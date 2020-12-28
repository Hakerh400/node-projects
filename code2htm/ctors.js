'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const {min, max} = Math;

const kNoRuleType = Symbol('noRuleType');

const decimal2str = num => {
  return String(num.toFixed(3));
};

const decimal2percent = num => {
  return `${decimal2str(num * 100)}%`;
};

class Base extends O.Stringifiable{}

class Scheme extends Base{
  parser = new Parser(this);
  vars = O.obj();
  globs = O.obj();
  ruleColl = new RuleCollection(this);

  hasVar(name){
    assert(typeof name === 'string');
    return name in this.vars;
  }

  addVar(name, val){
    assert(!this.hasVar(name));
    this.vars[name] = val;
    return this;
  }

  getVar(name){
    assert(this.hasVar(name));
    return this.vars[name];
  }

  hasGlob(name){
    assert(typeof name === 'string');
    return name in this.globs;
  }

  addGlob(name, val){
    assert(!this.hasGlob(name));
    this.globs[name] = val;
    return this;
  }

  getGlob(name){
    assert(this.hasGlob(name));
    return this.globs[name];
  }

  createRule(type, scopes){
    return this.ruleColl.createRule(type, scopes);
  }

  matchRules(scopes){
    return this.ruleColl.matchRules(scopes);
  }

  matchProps(scopes){
    const rules = this.matchRules(scopes);

    const props = rules.reduce((props, rule) => {
      return Object.assign(props, rule.props);
    }, O.obj());

    return props;
  }

  parse(str, method, opts={}){
    const {
      all=0,
      trimFirst=/^\s*/,
      trimSep=trimFirst,
    } = opts;

    if(trimFirst !== null)
      str = str.replace(trimFirst, '');

    if(str.length === 0){
      assert(all);
      return [];
    }

    const arr = all ? [] : null;

    str = [str];

    while(1){
      const result = O.rec([this.parser, method], str);

      if(!all){
        if(str[0].length !== 0)
          assert.fail(str[0]);

        return result;
      }

      arr.push(result);

      if(trimSep !== null)
        str[0] = str[0].replace(trimSep, '');

      if(str[0].length === null) break;
    }

    return arr;
  }

  parseExpr(str, opts){ return this.parse(str, 'parseExpr', opts); }
  parseScope(str, opts){ return this.parse(str, 'parseScope', opts); }
  parseScopesInfo(str, opts){ return this.parse(str, 'parseScopesInfo', opts); }

  toStr(){
    const {vars, globs, ruleColl: {rulesObj}} = this;
    const arr = ['Variables:', this.inc];

    for(const name of O.keys(vars))
      arr.push('\n', name, ': ', vars[name]);

    arr.push(this.dec, '\n\n');
    arr.push('Globals:', this.inc);

    for(const name of O.keys(globs))
      arr.push('\n', name, ': ', globs[name]);

    arr.push(this.dec, '\n\n');
    arr.push('Rules:', this.inc);

    for(const type of O.keys(rulesObj)){
      arr.push('\n', Rule.type2str(type), ':', this.inc);

      for(const rule of rulesObj[type])
        arr.push('\n', rule);

      arr.push(this.dec);
    }

    arr.push(this.dec);

    return arr;
  }
}

class RuleCollection extends Base{
  rulesObj = O.obj();
  rulesArr = [];

  createRule(type=kNoRuleType, scopes){
    const rule = new Rule(this.scheme, type, scopes);
    this.addRule(rule);
    return rule;
  }

  addRule(rule){
    const {rulesObj, rulesArr} = this;
    const {type} = rule;

    if(!(type in rulesObj))
      rulesObj[type] = new Set();

    rulesObj[type].add(rule);
    rulesArr.push(rule);

    return this;
  }

  matchRules(scopes){
    return this.rulesArr.map(rule => {
      return [rule.test(scopes), rule];
    }).filter(([level]) => {
      return level !== 0;
    }).sort(([level1], [level2]) => {
      return level1 - level2;
    }).map(([level, rule]) => {
      return rule;
    });
  }
}

class Rule extends Base{
  static supportedProps = O.arr2obj([
    'foreground',
    'background',
    'font_style',
    'foreground_adjust',
  ]);

  static isPropSupported(prop){
    return prop in this.supportedProps;
  }

  static type2str(type){
    return type === kNoRuleType ? '(no type)' : type;
  }

  props = O.obj();

  constructor(scheme, type, scope){
    super(scheme);

    this.type = type;
    this.scope = scope;
  }

  isPropSupported(prop){
    return this.constructor.isPropSupported(prop);
  }

  assertPropSupported(prop){
    assert(this.isPropSupported(prop), prop);
  }

  hasProp(prop){
    this.assertPropSupported(prop);
    return prop in this.props;
  }

  getProp(prop){
    this.assertPropSupported(prop);

    const {props} = this;
    if(prop in props) return props[prop];
    return null;
  }

  setProp(prop, val){
    this.assertPropSupported(prop);
    this.props[prop] = val;
  }

  get typeStr(){
    return this.constructor.type2str(this.type);
  }

  test(scopes){
    return O.rec([this.scope, 'test'], scopes);
  }

  toStr(){
    const {props} = this;
    const arr = ['Rule {', this.inc];

    arr.push('\n', 'Type: ', this.typeStr);
    arr.push('\n', 'Scope: ', this.scope);
    arr.push('\n', 'Properties:', this.inc);

    for(const prop of O.keys(props))
      arr.push('\n', prop, ': ', props[prop]);

    arr.push(this.dec);
    arr.push(this.dec, '\n}');

    return arr;
  }
}

class Scope extends Base{
  #id = null;

  get id(){
    if(this.#id === null)
      return this.#id = this.toString();

    return this.#id;
  }

  *negate(){ O.virtual('negate'); }
  *toArr(){ O.virtual('toArr'); }
  *test(){ O.virtual('test'); }

  toString(arg){
    if(this.#id !== null) return this.#id;
    return super.toString(arg);
  }
}

class ScopeLiteral extends Scope{
  constructor(scheme, idents){
    super(scheme);
    this.idents = idents;
  }

  *negate(){
    return new ScopeNegation(this);
  }

  *toArr(){
    return [this];
  }

  *test(scopes){
    const {idents} = this;
    const len = idents.length;

    findScope: for(const idents1 of scopes){
      for(let i = 0; i !== len; i++)
        if(idents1[i] !== idents[i])
          continue findScope;

      return len;
    };

    return 0;
  }

  toStr(){
    return this.idents.join('.');
  }
}

class ScopeOperation extends Scope{
  get opName(){ O.virtual('opName'); }
}

class ScopeUnaryOperation extends ScopeOperation{
  constructor(scope){
    super();

    assert(scope instanceof Scope);
    this.scope = scope;
  }

  toStr(){
    return [this.opName, this.scope];
  }
}

class ScopeNegation extends ScopeUnaryOperation{
  *negate(){
    return this.scope;
  }

  get opName(){ return '-'; }

  *test(scopes){
    const result = yield [[this.scope, 'test'], scopes];
    return result !== 0 ? 0 : 1;
  }
}

class ScopeBinaryOperation extends ScopeOperation{
  constructor(scope1, scope2){
    super();

    assert(scope1 instanceof Scope);
    assert(scope2 instanceof Scope);

    this.scope1 = scope1;
    this.scope2 = scope2;
  }

  toStr(){
    const {opName} = this;
    const op = opName !== null ? ` ${opName} ` : ' ';

    return ['(', this.scope1, op, this.scope2, ')'];
  }
}

class ScopeDisjunction extends ScopeBinaryOperation{
  get opName(){ return '|'; }

  *negate(){
    return new ScopeConjunction(
      yield [[this.scope1, 'negate']],
      yield [[this.scope2, 'negate']],
    );
  }

  *test(scopes){
    return max(
      (yield [[this.scope1, 'test'], scopes]),
      (yield [[this.scope2, 'test'], scopes]),
    );
  }
}

class ScopeConjunction extends ScopeBinaryOperation{
  get opName(){ return null; }

  *negate(){
    return new ScopeDisjunction(
      yield [[this.scope1, 'negate']],
      yield [[this.scope2, 'negate']],
    );
  }

  *toArr(){
    return [
      ...yield [[this.scope1, 'toArr']],
      ...yield [[this.scope2, 'toArr']],
    ];
  }

  *test(scopes){
    return min(
      (yield [[this.scope1, 'test'], scopes]),
      (yield [[this.scope2, 'test'], scopes]),
    );
  }
}

class ScopeInfo extends Base{
  constructor(scopes, start, end){
    super();

    if(scopes instanceof Scope)
      scopes = O.rec([scopes, 'toArr']).map(a => a.idents);

    this.scopes = scopes;
    this.start = start;
    this.end = end;
  }

  toStr(){
    const arr = [`((${this.start}, ${this.end}), '`];

    this.join(arr, this.scopes, ' ');
    arr.push(`')`);

    return arr;
  }
}

class Expression extends Base{
  constructor(scheme){
    super();
    this.scheme = scheme;
  }
}

class Color extends Expression{
  constructor(scheme, R, G, B, A=1){
    super(scheme);

    this.R = R;
    this.G = G;
    this.B = B;
    this.A = A;
  }

  withNewAlpha(A){
    const {R, G, B} = this;
    return new Color(this.scheme, R, G, B, A);
  }

  toStr(){
    const {R, G, B, A} = this;
    if(A === 1) return `#${[R, G, B].map(a => O.hex(a, 1)).join('')}`;
    return `rgba(${R}, ${G}, ${B}, ${decimal2str(A)})`
  }
}

class LightnessAdjustement extends Expression{
  constructor(scheme, dif){
    super(scheme);
    this.dif = dif;
  }

  toStr(){
    const {dif} = this;
    const sign = dif >= 0 ? '+' : '-';
    return `l(${sign}${decimal2percent(dif)})`;
  }
}

class Alpha extends Expression{
  constructor(scheme, A){
    super(scheme);
    this.A = A;
  }

  toStr(){
    return ['alpha(', this.A, ')'];
  }
}

class Constant extends Expression{
  toStr(){
    return String(this.val);
  }
}

class TextInfo extends Expression{
  attribs = O.obj();

  add(attrib){
    this.attribs[attrib.name] = attrib;
    return this;
  }

  get attribsArr(){
    const {attribs} = this;
    return O.keys(attribs).map(a => attribs[a]);
  }

  toStr(){
    return this.join([], this.attribsArr, ' ');
  }
}

module.exports = {
  kNoRuleType,

  decimal2str,
  decimal2percent,

  Base,
  Scheme,
  Rule,
  Scope,
  ScopeLiteral,
  ScopeOperation,
  ScopeUnaryOperation,
  ScopeNegation,
  ScopeBinaryOperation,
  ScopeDisjunction,
  ScopeConjunction,
  ScopeInfo,
  Expression,
  Color,
  LightnessAdjustement,
  Alpha,
  Constant,
  TextInfo,
};

const Parser = require('./parser');
module.exports.Parser = Parser;

const TextAttribute = require('./text-attrib');
module.exports.TextAttribute = TextAttribute;