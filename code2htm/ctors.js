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
  vars = O.obj();
  globs = O.obj();
  parser = new Parser(this);

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

  parseExpr(str){
    str = [str];

    const result = O.rec([this.parser, 'parseExpr'], str);

    if(str[0].length !== 0)
      assert.fail(str[0]);

    return result;
  }

  toStr(){
    const {vars, globs} = this;
    const arr = ['Variables:', this.inc];

    for(const name in vars)
      arr.push('\n', name, ': ', vars[name]);

    arr.push(this.dec, '\n\n');
    arr.push('Globals:', this.inc);

    for(const name in globs)
      arr.push('\n', name, ': ', globs[name]);

    arr.push(this.dec, '\n\n');

    return arr;
  }
}

class Parser extends Base{
  constructor(scheme){
    super();
    this.scheme = scheme;
  }

  match(str, pat, opts={}){
    const {
      force=1, 
      update=1, 
      trim=1,
    } = opts;

    let match = null;

    getMatch: {
      if(typeof pat === 'string'){
        if(!str[0].startsWith(pat)) break getMatch;
        match = [pat];
        break getMatch;
      }

      if(pat instanceof RegExp){
        match = str[0].match(pat);
        break getMatch;
      }

      assert.fail(pat);
    }

    const ok = match !== null;
    if(!ok && force) assert.fail();

    if(ok && update) str[0] = str[0].slice(match[0].length);
    if(trim) str[0] = str[0].replace(/^\s*(?:,\s*)?/, '');

    return ok ? match.length !== 1 ? match.slice(1) : match[0] : null;
  }

  matchOpenParen(str){ return this.match(str, '('); }
  matchClosedParen(str){ return this.match(str, ')'); }

  *parseExpr(str){
    let match = this.match(str, /^[a-zA-Z0-9_]+/, {force: 0});

    if(match !== null){
      const type = match;

      if(TextAttribute.isSupported(type))
        return TextAttribute.getType(type);

      switch(type){
        case 'var': yield O.tco([this, 'parseVarRef'], str); break;
        case 'hsl': yield O.tco([this, 'parseHSL'], str); break;
        case 'color': yield O.tco([this, 'parseColor'], str); break;
        case 'alpha': yield O.tco([this, 'parseAlpha'], str); break;
        case 'underline': return TextAttribute.UNDERLINE; break;

        default: assert.fail(type); break;
      }
    }

    assert.fail(str);
  }

  *parseVarRef(str){
    this.matchOpenParen(str);
    const name = yield [[this, 'parseIdent'], str, 0, 360];
    this.matchClosedParen(str);

    return this.getVar(name);
  }

  *parseHSL(str){
    this.matchOpenParen(str);
    const H = yield [[this, 'parseInt'], str, 0, 360];
    const S = yield [[this, 'parsePercent'], str];
    const L = yield [[this, 'parsePercent'], str];
    this.matchClosedParen(str);

    const rgb = O.Color.hsl2rgb(H, S, L);
    return new Color(this.scheme, ...rgb);
  }

  *parseColor(str){
    this.matchOpenParen(str);
    const baseCol = yield [[this, 'parseExpr'], str];
    const alpha = yield [[this, 'parseExpr'], str];
    this.matchClosedParen(str);

    assert(baseCol instanceof Color);
    assert(alpha instanceof Alpha);

    return baseCol.withNewAlpha(alpha.A);
  }

  *parseAlpha(str){
    this.matchOpenParen(str);
    const n = yield [[this, 'parseDecimal'], str];
    this.matchClosedParen(str);

    return new Alpha(n);
  }

  *parseInt(str, min=null, max=null){
    const n = +this.match(str, /^[+\-]?\d+/);

    if(min !== null && n < min) assert.fail(n);
    if(max !== null && n > max) assert.fail(n);

    return n;
  }

  *parseDecimal(str){
    const n = +this.match(str, /^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?/);
    return n;
  }

  *parsePercent(str){
    const n = yield [[this, 'parseInt'], str, 0, 100];
    this.match(str, '%');

    return n / 100;
  }

  *parseIdent(str){
    return this.match(str, /^[a-zA-Z0-9_]+/);
  }

  getVar(name){ return this.scheme.getVar(name); }
  getGlob(name){ return this.scheme.getGlob(name); }
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

module.exports = {
  Base,
  Scheme,
  Parser,
  Expression,
  Constant,
};

const TextAttribute = require('./text-attrib');
module.exports.TextAttribute = TextAttribute;