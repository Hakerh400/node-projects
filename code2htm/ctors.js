'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

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
  ruleCol = new RuleCollection(this);

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
    return this.ruleCol.createRule(type, scopes);
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

  toStr(){
    const {vars, globs, ruleCol: {rules}} = this;
    const arr = ['Variables:', this.inc];

    for(const name of O.keys(vars))
      arr.push('\n', name, ': ', vars[name]);

    arr.push(this.dec, '\n\n');
    arr.push('Globals:', this.inc);

    for(const name of O.keys(globs))
      arr.push('\n', name, ': ', globs[name]);

    arr.push(this.dec, '\n\n');
    arr.push('Rules:', this.inc);

    for(const type of O.keys(rules)){
      arr.push('\n', Rule.type2str(type), ':', this.inc);

      for(const rule of rules[type])
        arr.push('\n', rule);

      arr.push(this.dec);
    }

    arr.push(this.dec);

    return arr;
  }
}

class RuleCollection extends Base{
  rules = O.obj();

  createRule(type=kNoRuleType, scopes){
    const rule = new Rule(this.scheme, type, scopes);
    this.addRule(rule);
    return rule;
  }

  addRule(rule){
    const {rules} = this;
    const {type} = rule;

    if(!(type in rules))
      rules[type] = new Set();

    rules[type].add(rule);
    return this;
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

  constructor(scheme, type, scopes){
    super(scheme);

    this.type = type;
    this.scopes = scopes;
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

  toStr(){
    const {props} = this;
    const arr = ['Rule {', this.inc];

    arr.push('\n', 'Type: ', this.typeStr);
    arr.push('\n', 'Scopes: ', this.scopes);
    arr.push('\n', 'Properties:', this.inc);

    for(const prop of O.keys(props))
      arr.push('\n', prop, ': ', props[prop]);

    arr.push(this.dec);
    arr.push(this.dec, '\n}');

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

class Scope extends Base{
  *negate(){ O.virtual('negate'); }
}

class ScopeLiteral extends Scope{
  constructor(scheme, idents){
    super(scheme);
    this.idents = idents;
  }

  get id(){ return this.toString(); }

  *negate(){
    return new ScopeNegation(this);
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
}

class ScopeConjunction extends ScopeBinaryOperation{
  get opName(){ return null; }

  *negate(){
    return new ScopeDisjunction(
      yield [[this.scope1, 'negate']],
      yield [[this.scope2, 'negate']],
    );
  }
}

module.exports = {
  kNoRuleType,

  decimal2str,
  decimal2percent,

  Base,
  Scheme,
  Rule,
  Expression,
  Color,
  LightnessAdjustement,
  Alpha,
  Constant,
  TextInfo,
  Scope,
  ScopeLiteral,
  ScopeOperation,
  ScopeUnaryOperation,
  ScopeNegation,
  ScopeBinaryOperation,
  ScopeDisjunction,
  ScopeConjunction,
};

const Parser = require('./parser');
module.exports.Parser = Parser;

const TextAttribute = require('./text-attrib');
module.exports.TextAttribute = TextAttribute;