'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const cs = require('./ctors');

class Engine{
  constructor(src, input){
    this.src = src;
    this.input = input;
  }

  run(){
    const {src, input} = this;
    const io = new O.IO(input, 0, 1);

    const keywords = [
      'class', 'extends', 'static', 'if',
      'is', 'new', 'return',
    ];

    const keywordsObj = O.arr2obj(keywords);

    const classes = O.resObj({
      Object(){
        const c = new cs.Class('Object');
        c.setDefaultCtor();
        return c;
      },

      Data(){
        const c = new cs.Class('IO', 'Object');

        c.addAttrib(new cs.Identifier('bit', 'Object'));

        const ctor = new cs.Method(c);
        ctor.setNativeFunc(() => {

        });

        const read = new cs.Method(c, 'in', 'IO');
        read.setNativeFunc(() => {

        });
        c.addMethod(read);

        const write = new cs.Method(c, 'out', 'IO', [new cs.Identifier('bit', 'Object')]);
        write.setNativeFunc(() => {

        });
        c.addMethod(write);

        return c;
      },
    });

    const scopes = [];

    const err = (str, msg) => {
      O.exit(`${str}\n^\n\nSyntaxError: ${msg}`);
    };

    const kw = (str, name) => {
      if(name in keywordsObj) err(str, 'Keywords are not allowed for class, method and identifier names and types');
      return name;
    };

    const parseArgs = str => {
      if(str === '') return [];

      return str.split(/\s*\,\s*/).map(arg => {
        const m = arg.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)$/);
        if(m === null) err(str, 'Invalid arguments');
        return new cs.Identifier(kw(str, m[2]), kw(str, m[1]));
      });
    };

    O.tokenize(src, [
      // Whitespace
      /\s+/, O.nop,

      // Class definition
      /class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+extends\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{/, (type, str, gs) => {
        if(scopes.length >= 1) err(str, 'Nested classes are not allowed');

        const c = new cs.Class(kw(str, gs[0]), kw(str, gs[1]));
        if(c.name in classes) err(str, `Class ${O.sf(c.name)} has already been defined`);
        classes[c.name] = c;
        scopes.push(c);
      },

      // If-statement
      /if\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+is\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*\{/, (type, str, gs) => {
        if(scopes.length <= 1) err(str, 'If statement can appear only inside of a method');
        scopes.push(null);
      },

      // Constructor
      /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*?)\)\s*\{/, (type, str, gs) => {
        if(scopes.length === 0) err(str, 'Constructor must be defined inside of a class');
        if(scopes.length >= 2) err(str, 'Nested constructors are not allowed');

        const cref = scopes[0];
        const cname = scopes[0].name;
        const name = kw(str, gs[0]);
        if(name !== cname) err(str, 'Constructor must have the same name as the class that contains it');
        if(cref.hasCtor()) err(str, `Class ${O.sf(cname)} already has a constructor`);

        const ctor = new cs.Method(
          cname,
          name,
          cname,
          parseArgs(gs[1]),
        );

        cref.setCtor(ctor);
        scopes.push(ctor);
      },

      // Method
      /((?:static\s+)?)([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*([\s\S]*?)\s*\)\s*\{/, (type, str, gs) => {
        if(scopes.length === 0) err(str, 'Method must be defined inside of a class');
        if(scopes.length >= 2) err(str, 'Nested methods are not allowed');

        const cref = scopes[0];
        const cname = cref.name;
        const name = kw(str, gs[2]);
        const isStatic = gs[0].trim() === 'static';
        if(cref.hasMethod(name, isStatic)) err(str, `${isStatic ? 'Static m' : 'M'}ethod ${O.sf(name)} has already been defined`);

        const method = new cs.Method(
          cname,
          name,
          kw(str, gs[1]),
          parseArgs(gs[3]),
          isStatic,
        );

        cref.addMethod(method);
        scopes.push(method);
      },

      // Attribute
      /([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/, (type, str, gs) => {
        if(scopes.length === 0) err(str, 'Attribute must be defined inside of a class');
        if(scopes.length >= 2) err(str, 'Nested attributes are not allowed');

        const cref = scopes[0];
        const cname = scopes[0].name;
        const name = kw(str, gs[1]);
        if(cref.hasAttrib(name)) err(str, `Attribute ${O.sf(name)} has already been defined`);

        const attrib = new cs.Identifier(name, kw(str, gs[0]));
        cref.addAttrib(attrib);
      },

      // Closed brace
      /\}/, (type, str, gs) => {
        switch(scopes.length){
          case 0: {
            err(str, 'Unmatched closed brace');
            break;
          }

          case 1: { // Class
            scopes.pop();
            break;
          }

          case 2: { // Method
            scopes.pop();
            break;
          }

          default: { // If-statement
            scopes.pop();
            break;
          }
        }
      },

      // Syntax error
      (type, str, gs) => {
        err(str, 'Invalid syntax');
      },
    ], 0);

    O.wfs('C:/users/thomas/downloads/1.js', '('+require('util').inspect(classes, {depth:1/0}).replace(/\[Object\: null prototype\] /g, '')+')');

    return io.getOutput();
  }
}

module.exports = Engine;