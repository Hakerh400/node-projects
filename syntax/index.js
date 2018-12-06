'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

class Syntax{
  constructor(src){
    this.defs = O.obj();

    this.parseSrc(src);
  }

  parseSrc(src){
    const getDef = this.getDef.bind(this);

    O.sanll(src).forEach(src => {
      var lines = O.sanl(src).map(line => {
        line = line.trim();
        if(line === '/') line = '';
        return line;
      });

      var name = lines.shift();
      var pats = lines.map(line => parsePattern(line));

      getDef(name).pats = pats;
    });

    function parsePattern(line){
      var elems = line.match(/"(?:\\.|[^"])*"|[a-zA-Z0-9_\$]+/gs);
      if(elems === null) elems = [];

      return new Pattern(elems.map(str => {
        if(str[0] === '"'){
          str = str.slice(1, str.length - 1);
          return new Terminal(str);
        }

        return new NonTerminal(getDef(str));
      }));
    }
  }

  setDef(name, def){
    this.defs[name] = def;
  }

  getDef(name){
    const {defs} = this;
    if(!(name in defs))
      this.setDef(name, new Definition(name));
    return defs[name];
  }

  parse(str, name){
    const {defs} = this;
    const getDef = this.getDef.bind(this);

    const stack = [];
    push(name);

    while(1){
      var parsed = O.last(stack);
      var {def, i, j} = parsed;

      if(i === def.pats.length){
        pop();
        if(stack.length === 0)
          return parsed;
      }

      var pat = def.pats[i];
      var elem = pat.elems[j];

      return stack[0];
    }

    function push(name){
      var start = 0;
      if(stack.length !== 0)
        start = O.last(stack).end;

      var parsed = new Parsed(str, getDef(name), start);
      stack.push(parsed);
    }

    function pop(){

    }
  }
};

module.exports = Syntax;

class Parsed{
  constructor(str, def, start=0, end=start, i=0, j=0, elems=[]){
    this.str = str;
    this.def = def;
    this.start = start;
    this.end = end;

    this.i = i;
    this.j = j;

    this.elems = [];
  }

  toString(){
    return this.str.slice(this.start, this.end);
  }
};

class Definition{
  constructor(name, pats=[]){
    this.name = name;
    this.pats = pats;
  }
};

class Pattern{
  constructor(elems=[]){
    this.elems = elems;
  }
};

class Element{
  isTerm(){ return !this.isNterm(); }
  isNterm(){ return 0; }
};

class Terminal extends Element{
  constructor(str){
    super();
    this.str = str;
  }

  isNterm(){ return 0; }
};

class NonTerminal extends Element{
  constructor(def){
    super();
    this.def = def;
  }

  isNterm(){ return 1; }
};