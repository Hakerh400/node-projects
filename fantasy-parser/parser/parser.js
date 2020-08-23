'use strict';

const assert = require('assert');
const O = require('omikron');
const Terminal = require('./terminal');
const NonTerminal = require('./non-terminal');
const Label = require('./label');

class Parser{
  lexer = null;
  rules = new Map();
  idents = O.obj();
  labels = O.obj();

  setLexer(lexer){
    assert(this.lexer === null);
    this.lexer = lexer;
  }

  addRule(rule){
    const {rules} = this;
    const {nterm} = rule;

    assert(nterm !== null);
    assert(!rules.has(nterm));

    rules.set(nterm, rule);
  }

  getIdent(name, type){
    // type = 0 ---> Terminal
    // type = 1 ---> Non-terminal

    const {idents} = this;

    if(name in idents){
      const elem = idents[name];
      assert(elem.type === type);
      return elem;
    }

    return idents[name] = type ? new NonTerminal(name) : new Terminal(name);
  }

  getTerm(name){
    return this.getIdent(name, 0);
  }

  getNterm(name){
    return this.getIdent(name, 1);
  }

  getElem(name){
    const {idents} = this;

    if(name in idents) return idents[name];
    return this.getNterm(name);
  }

  getLabel(name){
    const {labels} = this;

    if(name in labels) return labels[name];
    return labels[name] = new Label(name);
  }
}

module.exports = Parser;