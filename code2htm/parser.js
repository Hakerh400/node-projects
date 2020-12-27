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
      trim=/^\s*/,
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

    if(!ok && force){
      O.logb();
      log('pat: ' + pat);
      log('str: ' + str[0]);
      O.logb();
      assert.fail();
    }

    if(ok && update){
      str[0] = str[0].slice(match[0].length);
      if(trim !== null) str[0] = str[0].replace(trim, '');
    }

    return ok ? match.length !== 1 ? match.slice(1) : match[0] : null;
  }

  matchOpenParen(str){ return this.match(str, '('); }
  matchClosedParen(str){ return this.match(str, ')'); }
  matchComma(str){ return this.match(str, ','); }

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
        case 'hsl': yield O.tco([this, 'parseHslCol'], str); break;
        case 'hsla': yield O.tco([this, 'parseHslaCol'], str); break;
        case 'color': yield O.tco([this, 'parseColor'], str); break;
        case 'alpha': yield O.tco([this, 'parseAlpha'], str); break;
        case 'l': yield O.tco([this, 'parseLightnessAdj'], str); break;

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

  *parseHsl(str){
    const H = yield [[this, 'parseInt'], str, 0, 360];
    this.matchComma(str);
    const S = yield [[this, 'parsePercent'], str];
    this.matchComma(str);
    const L = yield [[this, 'parsePercent'], str];

    return [H, S, L];
  }

  *parseHslCol(str){
    this.matchOpenParen(str);
    const [H, S, L] = yield [[this, 'parseHsl'], str];
    this.matchClosedParen(str);

    const rgb = O.Color.hsl2rgb(H, S, L);
    return new cs.Color(this.scheme, ...rgb);
  }

  *parseHslaCol(str){
    this.matchOpenParen(str);
    const [H, S, L] = yield [[this, 'parseHsl'], str];
    this.matchComma(str);
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

  *parseLightnessAdj(str){
    this.matchOpenParen(str);
    assert(str[0].length !== 0);

    const match = this.match(str, /^[+\-]/, {force: 0, update: 0});
    let sign = 1;

    if(match !== null){
      this.match(str, match);
      sign = match === '+' ? 1 : -1;
    }

    let n = yield [[this, 'parsePercent'], str];
    n *= sign;

    this.matchClosedParen(str);

    return new cs.LightnessAdjustement(n);
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

  *parseScope(str){
    yield O.tco([this, 'parseScopeDisjunction'], str);
  }

  // A, B, C
  // A | B | C
  *parseScopeDisjunction(str, top=1){
    let result = null;

    while(1){
      assert(str[0].length !== 0);

      const scope = yield [[this, 'parseScopeConjuction'], str];
      
      if(result === null) result = scope;
      else result = new cs.ScopeDisjunction(result, scope);

      if(str[0].length === 0) break;

      const char = str[0][0];
      
      if(char === ',') assert(top);

      if(char === ')'){
        assert(!top);
        break;
      }

      this.match(str, /^[,\|]/);
    }

    return result;
  }

  // A B C
  *parseScopeConjuction(str){
    let result = null;

    while(1){
      assert(str[0].length !== 0);

      const scope = yield [[this, 'parseScopeTerm'], str];

      if(result === null) result = scope;
      else result = new cs.ScopeConjunction(result, scope);

      if(str[0].length === 0) break;

      const char = str[0][0];
      if(/[,\|\)]/.test(char)) break;
    }

    return result;
  }

  // (A)
  // -A
  // A
  *parseScopeTerm(str){
    assert(str[0].length !== 0);

    const char = str[0][0];

    if(char === '('){
      this.matchOpenParen(str);
      const scope = yield [[this, 'parseScopeDisjunction'], str, 0];
      this.matchClosedParen(str);

      return scope;
    }

    if(char === '-'){
      this.match(str, char);
      const scope = yield [[this, 'parseScopeTerm'], str];
      yield O.tco([scope, 'negate']);
    }

    yield O.tco([this, 'parseScopeLiteral'], str);
  }

  *parseScopeLiteral(str){
    const idents = [];

    while(1){
      idents.push(yield [[this, 'parseIdent'], str, {dash: 1}]);
      if(!str[0].startsWith('.')) break;
      str[0] = str[0].slice(1);
    }

    return new cs.ScopeLiteral(this.scheme, idents);
  }

  getVar(name){ return this.scheme.getVar(name); }
  getGlob(name){ return this.scheme.getGlob(name); }
}

module.exports = Object.assign(Parser, {
  checkBounds,
});