'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const O = require('../framework');

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

const patTypes = O.enum([
  'TERMINAL',
  'NON_TERMINAL',
]);

class Syntax{
  constructor(src){
    [this.defs, this.defsObj] = Syntax.parseSrc(src);
  }

  static parseSrc(src){
    var defs = [];
    var defsObj = O.obj();

    O.sanll(O.sanl(src).join('\n')).forEach((str, defIndex) => {
      var def = new Definition(this);
      defs.push(def);

      str.match(/.+(?:\n\s+.*)*/g).map((str, sectIndex) => {
        var lines = O.sanl(str);
        var header = lines.shift();

        if(lines.length === 0) var tabSize = 0;
        else var tabSize = lines[0].match(/^\s+/)[0].length;

        lines = lines.map(line => line.substring(tabSize));

        if(sectIndex === 0){
          def.name = header;
          defsObj[def.name] = def;

          lines.forEach((line, lineIndex) => {
            def.matches.push(Syntax.parsePattern(line));
          });

          return;
        }

        var [name, args] = header.match(/^([^\(]*)\(([^\)]*)\)/).slice(1);
        var body = lines.join('\n');

        var func = new CheckerFunction(name, args, body);
        def[name] = func;
      });
    });

    defs.forEach(def => {
      def.matches.forEach(match => {
        match.forEach(pat => {
          if(pat.type !== patTypes.NON_TERMINAL) return;
          pat.data = defsObj[pat.data];
        });
      });
    });

    return [defs, defsObj];
  }

  static parsePattern(str){
    var pats = [];

    while(1){
      str = str.substring(str.match(/^\s*/)[0].length);
      if(str.length === 0) break;

      if(/^[a-zA-Z]/.test(str)){
        var name = str.match(/^\S+/)[0];
        str = str.substring(name.length);
        pats.push(new Pattern(patTypes.NON_TERMINAL, name));
        continue;
      }

      if(/^"/.test(str)){
        var n = 2;

        while(1){
          try{ var s = JSON.parse(str.substring(0, n)); }
          catch{ var s = null; };

          if(s === null){
            n++;
            continue;
          }

          pats.push(new Pattern(patTypes.TERMINAL, s));
          str = str.substring(n);
          break;
        }
      }
    }

    return pats;
  }

  parse(str, defName){
    var logStr = '';
    var firstLog = 1;

    ////////////////////////////////////////////////////////////////////////////////////////////////////

    var def = this.defsObj[defName];
    var len = str.length;

    var stack = [new StackFrame(def)];

    while(1){
      break;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////

    return logStr;

    function log(...args){
      if(args.length === 1 && typeof args[0] === 'string'){
        var str = args[0];
      }else{
        var str = args.map(arg => {
          return util.inspect(arg);
        });
      }

      if(firstLog) firstLog = 0;
      else logStr += '\n';

      logStr += str;
    }
  }
};

class Definition{
  constructor(syntax, name='', matches=[], before=null, after=null){
    this.syntax = syntax;
    this.name = name;
    this.matches = matches;
    this.before = before;
    this.after = after;
  }

  toString(){
    var str = `${this.name}\n${
      this.matches.map(match => TAB + match.join(' ')).join('\n')
    }`;

    if(this.before !== null) str += `\n${this.before}`;
    if(this.after !== null) str += `\n${this.after}`;

    return str;
  }
};

class Pattern{
  constructor(type, data=null){
    this.type = type;
    this.data = data;
  }

  toString(){
    switch(this.type){
      case patTypes.TERMINAL:
        return JSON.stringify(this.data);
        break;

      case patTypes.NON_TERMINAL:
        if(typeof this.data === 'string') return this.data;
        return this.data.name;
        break;
    }
  }
};

class CheckerFunction{
  constructor(name, args, body){
    this.name = name;
    this.args = args;
    this.body = body;

    body += '\nreturn 1;';
    this.func = new Function(args, body);
  }

  toString(){
    return `${this.name}(${this.args})\n${
      O.sanl(this.body).map(line => TAB + line).join('\n')
    }`;
  }
};

class StackFrame{
  constructor(def, charIndex=0, matchIndex=0, patIndex=0, data=O.obj(), elem=null){
    this.def = def;
    this.charIndex = charIndex;
    this.matchIndex = matchIndex;
    this.patIndex = patIndex;
    this.data = data;
    this.elem = elem;
  }
};

Syntax.Definition = Definition;
Syntax.Pattern = Pattern;
Syntax.CheckerFunction = CheckerFunction;
Syntax.StackFrame = StackFrame;

module.exports = Syntax;