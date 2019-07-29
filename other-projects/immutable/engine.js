'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');

class Engine{
  constructor(src, input){
    this.src = src;
    this.input = input;
  }

  run(){
    const {src, input} = this;
    const io = new O.IO(input, 0, 1);

    const tokens = {
      whiteSpace: /\s+/,
      classDef: /class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+extends\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{/,
      method: /((?:static\s+)?)([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*\{/,
      if: /if\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+is\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*\{/,
      closedBrace: /\}/,
    };

    const scopes = {
      class: 0,
      method: 0,
      if: 0,
    };

    const classes = [];

    const err = (str, msg) => {
      O.exit(`${str}\n^\n\nSyntaxError: ${msg}`);
    };

    for(const [type, str, gs] of O.tokenize(src, tokens)){
      switch(type){
        case 'classDef':
          if(scopes.class) err(str, 'Nested classes are not allowed');
          classes.push({
            name: gs[0],
            extends: gs[1],
          });
          scopes.class = 1;
          break;

        case 'method':
          if(!scopes.class) err(str, 'Method must be defined inside a class');
          if(scopes.method) err(str, 'Nested methods are not allowed');
          scopes.method = 1;
          break;

        case 'if':
          if(!scopes.method) err(str, 'If statement can appear only inside of a method');
          log(gs);
          scopes.if++;
          break;

        case 'closedBrace':
          if(scopes.if !== 0){
            scopes.if--;
          }else if(scopes.method){
            scopes.method = 0;
          }else if(scopes.class){
            scopes.class = 0;
          }else{
            err(str, 'Unmatched closed brace');
          }
          break;
      }
    }

    log(classes);

    return io.getOutput();
  }
}

module.exports = Engine;