'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const decimal2str = num => {
  return String(num.toFixed(3));
};

class Base extends O.Stringifiable{}

class Scheme extends Base{
  parser = new Parser(this);
  vars = O.obj();
  globs = O.obj();
  rules = O.obj();

  hasVar(name){
    assert(typeof name === 'string');
    return name in this.vars;
  }

  addVar(name, val){
    assert(!this.hasVar(name));
    this.vars[name] = val;
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
  }

  getGlob(name){
    assert(this.hasGlob(name));
    return this.globs[name];
  }

  createRule(name, scope){
    return new Rule(this, name, scope);
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
  parseScopeSet(str, opts){ return this.parse(str, 'parseScopeSet', opts); }

  toStr(){
    const {vars, globs, rules} = this;
    const arr = ['Variables:', this.inc];

    for(const name in vars)
      arr.push('\n', name, ': ', vars[name]);

    arr.push(this.dec, '\n\n');
    arr.push('Globals:', this.inc);

    for(const name in globs)
      arr.push('\n', name, ': ', globs[name]);

    arr.push(this.dec, '\n\n');
    arr.push('Rules:', this.inc);

    for(const name in rules)
      arr.push('\n', name, ': ', rules[name]);

    return arr;
  }
}

class Rule extends Base{
  static supportedProps = O.arr2obj([
    'foreground',
    'background',
    'font_style',
  ]);

  static isPropSupported(prop){
    return prop in this.supportedProps;
  }

  props = O.obj();

  constructor(scheme, name, scopes){
    super(scheme);

    this.name = name;
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

  toStr(){
    return this.join([], [...this.attribs], ' ');
  }
}

class ScopeSet extends Base{
  included = new Set();
  excluded = new Set();

  constructor(scheme, inc=null, exc=null){
    super(scheme);

    if(inc !== null) this.includeAll(inc);
    if(exc !== null) this.excludeAll(exc);
  }

  include(scope){
    this.included.add(scope);
    this.excluded.delete(scope);
    return this;
  }

  exclude(scope){
    this.included.delete(scope);
    this.excluded.add(scope);
    return this;
  }

  includeAll(scopes){
    for(const scope of scopes)
      this.include(scope);
    return this;
  }

  excludeAll(scopes){
    for(const scope of scopes)
      this.exclude(scope);
    return this;
  }

  negate(){
    [this.included, this.excluded] = [this.excluded, this.included];
    return this;
  }

  union(other){
    this.includeAll(other.included);
    this.excludeAll(other.excluded);
    return this;
  }

  toStr(){
    const arr = [];

    for(const sc of this.included){
      if(arr.length !== 0) arr.push(', ');
      arr.push(sc);
    }

    for(const sc of this.excluded){
      if(arr.length !== 0) arr.push(', ');
      arr.push('-', sc);
    }

    return arr;
  }
}

class Scope extends Base{
  constructor(scheme, idents){
    super(scheme);
    this.idents = idents;
  }

  toStr(){
    return this.idents.join('.');
  }
}

module.exports = {
  Base,
  Scheme,
  Rule,
  Expression,
  Color,
  Alpha,
  Constant,
  TextInfo,
  ScopeSet,
  Scope,
};

const Parser = require('./parser');
module.exports.Parser = Parser;

const TextAttribute = require('./text-attrib');
module.exports.TextAttribute = TextAttribute;