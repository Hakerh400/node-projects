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
    assert(str[0].length === 0);

    return result;
  }

  toStr(){
    const {vars, globs} = this;
    const arr = ['Variables:', O.inc];

    for(const name in vars)
      arr.push('\n', name, ': ', vars[name]);

    arr.push(O.dec, '\n\n');
    arr.push('Globals:', O.inc);;

    for(const name in globs)
      arr.push('\n', name, ': ', globs[name]);

    arr.push(O.dec, '\n\n');

    return arr;
  }
}

class Parser extends Base{
  constructor(scheme){
    super();
    this.scheme = scheme;
  }

  match(str, reg, {force=1, update=1, trim=1}={}){
    const match = str[0].match(reg);

    if(force && match === null)
      assert.fail();

    if(update) str[0] = str[0].slice(match[0].length);
    if(trim) str[0] = str[0].replace(/^\s*(?:,\s*)?/, '');

    return match.slice(1);
  }

  *parseExpr(str){
    const match = this.match(str, /^([a-zA-Z0-9]+)\(/, {force: 0});

    if(match !== null){
      const funcName = match[0];

      switch(funcName){
        case 'var': yield O.tco([this, 'parseVarRef'], str); break;
        case 'hsl': yield O.tco([this, 'parseHSL'], str); break;
        case 'color': yield O.tco([this, 'parseColor'], str); break;

        default: assert.fail(funcName); break;
      }
    }

    assert.fail(str);
  }

  *parseVarRef(str){
    const [name] = this.match(str, /^([a-zA-Z0-9]+)\)/);
    return this.getVar(name);
  }

  *parseHSL(str){
    const H = yield [[this, 'parseInt'], str, 0, 360];
    const S = yield [[this, 'parsePercent'], str];
    const L = yield [[this, 'parsePercent'], str];
    const rgb = O.Color.hsl2rgb(H, S, L);

    return new Color(this.scheme, ...rgb);
  }

  *parseInt(str, min=null, max=null){
    const n = +this.match(str, /^\d+/)[0];

    if(min !== null && n < min) assert.fail(n);
    if(max !== null && n > max) assert.fail(n);

    return n;
  }

  *parsePercent(str){
    const n = yield this.parseInt(str, 0, 100);
    this.match(str, /^%/);

    return n / 100;
  }

  *parseColor(str){
    const baseCol = yield [[this, 'parseColor'], str];
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

  toStr(){
    const {R, G, B, A} = this;
    if(A === 1) return `#${[R, G, B].map(a => O.hex(a, 1)).join('')}`;
    return `rgba(${R}, ${G}, ${B}, ${decimal2str(A)})`
  }
}

module.exports = {
  Base,
  Scheme,
  Parser,
  Expression,
};