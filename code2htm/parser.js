'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const cs = require('./ctors');

const checkBounds = (n, min, max) => {
  if(min !== null && n < min) assert.fail(n);
  if(max !== null && n > max) assert.fail(n);
  return n;
};

class Parser{
  constructor(scheme){
    this.scheme = scheme;
  }

  match(str, pat, opts={}){
    const {
      force=1, 
      update=1, 
      trim=/^\s*(?:,\s*)?/,
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

    if(ok && update){
      str[0] = str[0].slice(match[0].length);
      if(trim !== null) str[0] = str[0].replace(trim, '');
    }

    return ok ? match.length !== 1 ? match.slice(1) : match[0] : null;
  }

  matchOpenParen(str){ return this.match(str, '('); }
  matchClosedParen(str){ return this.match(str, ')'); }

  *parseExpr(str){
    let match = this.match(str, /^[a-zA-Z0-9_]+/, {force: 0});

    if(match !== null){
      const type = match;

      if(cs.TextAttribute.isTypeSupported(type)){
        const info = new cs.TextInfo();

        info.add(cs.TextAttribute.getType(type));

        while(1){
          const type = this.match(str, /^[a-zA-Z0-9_]+/, {force: 0, update: 0});
          if(type === null) break;
          if(!cs.TextAttribute.isTypeSupported(type)) break;

          this.match(str, type);
          info.add(cs.TextAttribute.getType(type));
        }

        return info;
      }

      switch(type){
        case 'var': yield O.tco([this, 'parseVarRef'], str); break;
        case 'hsl': yield O.tco([this, 'parseHSLCol'], str); break;
        case 'hsla': yield O.tco([this, 'parseHSLACol'], str); break;
        case 'color': yield O.tco([this, 'parseColor'], str); break;
        case 'alpha': yield O.tco([this, 'parseAlpha'], str); break;

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
    const H = yield [[this, 'parseInt'], str, 0, 360];
    const S = yield [[this, 'parsePercent'], str];
    const L = yield [[this, 'parsePercent'], str];

    return [H, S, L];
  }

  *parseHSLCol(str){
    this.matchOpenParen(str);
    const [H, S, L] = yield [[this, 'parseHSL'], str];
    this.matchClosedParen(str);

    const rgb = O.Color.hsl2rgb(H, S, L);
    return new cs.Color(this.scheme, ...rgb);
  }

  *parseHSLACol(str){
    this.matchOpenParen(str);
    const [H, S, L] = yield [[this, 'parseHSL'], str];
    const A = yield [[this, 'parseDecimal'], str, 0, 1];
    this.matchClosedParen(str);

    const rgb = O.Color.hsl2rgb(H, S, L);
    return new cs.Color(this.scheme, ...rgb);
  }

  *parseColor(str){
    this.matchOpenParen(str);
    const baseCol = yield [[this, 'parseExpr'], str];
    const alpha = yield [[this, 'parseExpr'], str];
    this.matchClosedParen(str);

    assert(baseCol instanceof cs.Color);
    assert(alpha instanceof cs.Alpha);

    return baseCol.withNewAlpha(alpha.A);
  }

  *parseAlpha(str){
    this.matchOpenParen(str);
    const n = yield [[this, 'parseDecimal'], str];
    this.matchClosedParen(str);

    return new cs.Alpha(n);
  }

  *parseInt(str, min, max){
    const n = +this.match(str, /^[+\-]?\d+/);
    return checkBounds(n, min, max);
  }

  *parseDecimal(str, min, max){
    const n = +this.match(str, /^[+\-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+\-]?\d+)?/);
    return checkBounds(n, min, max);
  }

  *parsePercent(str){
    const n = yield [[this, 'parseInt'], str, 0, 100];
    this.match(str, '%');

    return n / 100;
  }

  *parseIdent(str, opts={}){
    const {
      dash=0,
      underscore=1,
    } = opts;

    const reg = new RegExp(`^[a-zA-Z0-9${
      dash ? '\\-' : ''}${
      underscore ? '\x5F' : ''}]+`)

    return this.match(str, reg);
  }

  *parseScopeSet(str, prec=1, top=1, first=1){
    const {scheme} = this;

    const newSet = () => {
      return new cs.ScopeSet(scheme);
    };

    if(str[0].length === 0){
      assert(top);
      assert(!first);
      assert(prec === 1);

      return newSet();
    }

    const char = str[0][0];

    if(char === ')'){
      assert(!top);
      assert(!first);
      assert(prec === 1);

      return newSet();
    }

    let set1;

    parseSet1: {
      if(/[a-zA-Z0-9\-_]/.test(char)){
        const scope = yield [[this, 'parseScope'], str];
        set1 = newSet().include(scope);

        break parseSet1;
      }

      if(char === '('){
        this.matchOpenParen(str);
        set1 = yield [[this, 'parseScopeSet'], str, 1, 0, 1];
        this.matchClosedParen(str);

        break parseSet1;
      }

      if(char === '|'){
        this.match(str, char);
        set1 = yield [[this, 'parseScopeSet'], str, 0, top, first];

        break parseSet1;
      }

      if(char === '-'){
        this.match(str, char);
        set1 = yield [[this, 'parseScopeSet'], str, 0, top, first];
        set1.negate();

        break parseSet1;
      }

      assert.fail(str);
    }

    if(prec === 0) return set1;

    const set2 = yield [[this, 'parseScopeSet'], str, 1, top, 0];
    return set1.union(set2);

    assert.fail(str);
  }

  *parseScope(str){
    const idents = [];

    while(1){
      idents.push(yield [[this, 'parseIdent'], str, {dash: 1}]);
      if(!str[0].startsWith('.')) break;
      str[0] = str[0].slice(1);
    }

    return new cs.Scope(this.scheme, idents);
  }

  getVar(name){ return this.scheme.getVar(name); }
  getGlob(name){ return this.scheme.getGlob(name); }
}

module.exports = Object.assign(Parser, {
  checkBounds,
});