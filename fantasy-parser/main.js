'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const Lexer = require('./lexer');
const LexerRule = require('./lexer/lexer-rule');
const StringPattern = require('./lexer/string-pattern');
const RegexPattern = require('./lexer/regex-pattern');

const cwd = __dirname;
const specFile = path.join(cwd, 'spec.txt');

const main = () => {
  const spec = O.rfs(specFile, 1);
  let index = 0;

  //////////////////
  //              //
  //  Assertions  //
  //              //
  //////////////////

  // Assert that the given condition is true
  const chk = (cond, msg) => {
    assert(cond, msg);
  };

  // Assert that two values are equal
  const eq = (a, b, msg) => {
    assert.strictEqual(a, b, msg);
  };

  // Assert that two values are not equal
  const neq = (a, b, msg) => {
    assert.notStrictEqual(a, b, msg);
  };

  // Assert fail
  const fail = msg => {
    assert.fail(msg);
  };

  // Assert that the next char is equal to the given char
  const eqc = (a, consume, msg) => {
    eq(ch(consume), a, msg);
  };

  //////////////////////////////
  //                          //
  //  Spec parsing functions  //
  //                          //
  //////////////////////////////

  // Read a single char
  const ch = consume => {
    neq(index, spec.length);

    const c = spec[index];
    if(consume) index++;

    return c;
  };

  // Read zero or more whitespace chars
  const sp = () => {
    while(/\s/.test(ch(0))) ch(1);
  };

  const lexer = new Lexer();

  {
    ///////////////////////////////
    //                           //
    //  Lexer parsing functions  //
    //                           //
    ///////////////////////////////

    // Parse string
    const parseStr = () => {
      // Open string literal
      eqc('"', 1);

      // String
      let str = '"';

      // Parse string chars
      while(1){
        const c = ch(1);
        str += c;

        // End of the string
        if(c === '"') break;

        // Escape sequence
        if(c === '\\'){
          str += ch(1);
          continue;
        }
      }

      // Return the parsed string
      return JSON.parse(str);
    };

    // Parse regex
    const parseReg = () => {
      // Open regex literal
      eqc('/', 1);

      // Regex
      let reg = '';

      while(1){
        const c = ch(1);

        // End of the regex
        if(c === '/') break;

        // Escape sequence
        if(c === '\\'){
          reg += '\\' + ch(1);
          continue;
        }

        // Other char
        reg += c;
      }

      // Return the parsed regex
      return new RegExp(reg);
    };

    //////////////////////////
    //                      //
    //  Parsing lexer spec  //
    //                      //
    //////////////////////////

    // The start of the lexer section
    sp();
    eqc('(', 1);

    // Parse lexer rules
    while(1){
      // Start of a rule or end of the lexer spec
      sp();
      const c = ch(1);

      // End of the lexer spec
      if(c === ')') break;

      // Start of a rule
      eq(c, '(');

      const rule = new LexerRule();

      // Parse lexer rule elements
      while(1){
        sp();
        const c = ch(0);

        // End of the lexer rule
        if(c === ')') break;

        // String pattern
        if(c === '"'){
          const str = parseStr();
          rule.setPattern(new StringPattern(str));
          continue;
        }

        // String pattern
        if(c === '/'){
          const reg = parseReg();
          rule.setPattern(new RegexPattern(reg));
          continue;
        }

        fail(O.sf(c));
      }
    }
  }
};

main();