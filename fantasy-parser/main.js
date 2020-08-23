'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const Parser = require('./parser');
const ParserRule = require('./parser/parser-rule');
const Lexer = require('./lexer');
const LexerRule = require('./lexer/lexer-rule');
const StringPattern = require('./lexer/string-pattern');
const RegexPattern = require('./lexer/regex-pattern');

const cwd = __dirname;
const specFile = path.join(cwd, 'spec.txt');

const main = () => {
  const spec = O.rfs(specFile, 1);
  const specLen = spec.length;
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

  // End of spec
  const eof = () => {
    return index === specLen;
  };

  // Not end of spec
  const neof = () => {
    return index !== specLen;
  };

  // Read a single char
  const ch = consume => {
    chk(neof());

    const c = spec[index];
    if(consume) index++;

    return c;
  };

  // Read zero or more whitespace chars
  const sp = () => {
    while(neof() && /\s/.test(ch(0)))
      ch(1);
  };

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

    neq(reg.length, 0);

    // Return the parsed regex
    return new RegExp(reg);
  };

  // Parse identifier
  const parseIdent = () => {
    // Identifier
    let ident = '';

    // Parse identifier chars
    while(1){
      const c = ch(0);

      // End of the identifier
      if(!/\w/.test(c)) break;

      // Identifier char
      ident += ch(1);
    }

    neq(ident.length, 0, `Expected an identifier, but got '${ch(0)}'`);

    // Return the identifier
    return ident;
  };

  // Parse list of identifiers
  const parseIdentList = () => {
    const c = ch(0);

    // Start of a list
    eqc('(', 1);

    // Identifier list
    const idents = [];

    while(1){
      sp();
      const c = ch(0);

      // End to the identifier list
      if(c === ')') break;

      // Parse the next identifier
      idents.push(parseIdent());
    }

    neq(idents.length, 0);

    // Return the parsed identifier list
    return idents;
  };

  const parsePat = () => {
    const c = ch(0);

    // String pattern
    if(c === '"'){
      const str = parseStr();
      return new StringPattern(str);
    }

    // Regex pattern
    if(c === '/'){
      const reg = parseReg();
      return new RegexPattern(reg);
    }

    fail(c);
  };

  // Create a new parser
  const parser = new Parser();

  //////////////////////////
  //                      //
  //  Parsing lexer spec  //
  //                      //
  //////////////////////////

  {
    // Create a new lexer
    const lexer = new Lexer();

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

      // Create a new lexer rule
      const rule = new LexerRule();

      // Parse lexer rule elements
      while(1){
        sp();
        const c = ch(0);

        // End of the lexer rule
        if(c === ')'){
          ch(1);
          break;
        }

        // Pattern
        if(/["\/]/.test(c)){
          const pat = parsePat();
          rule.setPattern(pat);
          continue;
        }

        // Terminal
        if(/\w/.test(c)){
          const ident = parseIdent();
          rule.addTerm(parser.getTerm(ident));
          continue;
        }

        // Terminal list
        if(c === '('){
          const idents = parseIdentList();

          for(const ident of idents)
            rule.addTerm(parser.getTerm(ident));

          continue;
        }

        fail(O.sf(c));
      }

      // Add the rule to the lexer
      lexer.addRule(rule);
    }

    // Add lexer to the parser
    parser.setLexer(lexer);
  }

  ///////////////////////////
  //                       //
  //  Parsing parser spec  //
  //                       //
  ///////////////////////////

  {
    // Parse parser rules
    while(1){
      sp();

      // End of parser spec
      if(eof()) break;

      // Create a new parser rule
      const rule = new ParserRule(parser);

      // Nonterminal whose definition we are parsing
      const nterm = parser.getNterm(parseIdent());
      rule.setNterm(nterm);

      // Start of the definition
      sp();
      eqc('(', 1);

      while(1){
        sp();
        const c = ch(0);

        // End of the definition
        if(c === ')'){
          ch(1);
          break;
        }

        // Parse identifier
        const ident = parseIdent();

        // Check whether it is a label or not
        sp();
        const isLab = ch(0) === ':';

        // If it is a label, then open a new section
        if(isLab){
          ch(1);
          rule.openSection(parser.getLabel(ident));
          continue;
        }

        // If it is an identifier, add it to the rule
        rule.addElem(parser.getElem(ident));
      }

      // Close the last section
      rule.closeSection();

      // Add the rule to the parser
      parser.addRule(rule);
    }
  }

  O.logf(parser);
};

main();