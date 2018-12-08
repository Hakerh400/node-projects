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
          str = JSON.parse(str);
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
    const strObj = new String(str);

    const stack = [];
    push(name);

    while(1){
      var pd = O.last(stack);

      if(stack.length > (str.length - pd.end >> 1) + 4 || pd.i === pd.def.pats.length){
        if(stack.length === 1) return null;

        stack.pop()
        pd = O.last(stack);
        next();

        continue;
      }

      var pat = pd.def.pats[pd.i];

      if(pd.j === pat.elems.length){
        if(stack.length === 1){
          if(pd.end !== str.length){
            next();
            continue;
          }
          return pd;
        }

        stack.pop();

        var parent = O.last(stack);
        parent.push(pd);

        continue;
      }

      var elem = pat.elems[pd.j];

      if(elem.isTerm()){
        if(!str.slice(pd.end).startsWith(elem.str)){
          next();
          continue;
        }

        pd.end += elem.str.length;
        pd.j++;

        continue;
      }

      push(elem.def.name);
    }

    function push(name){
      var pd = new Parsed(strObj, O.last(stack), getDef(name));
      stack.push(pd);
    }

    function next(){
      pd.next(stack);
    }
  }
};

module.exports = Syntax;

class Parsed{
  constructor(str, parent, def, i=0, j=0, elems=[]){
    this.str = str;
    this.parent = parent;
    this.def = def;

    this.start = parent !== null ? parent.end : 0;
    this.end = this.start;

    this.i = i;
    this.j = j;

    this.elems = [];
  }

  set(str){
    this.str = str;
    this.start = 0;
    this.end = str.length;
  }

  push(elem){
    elem.parent = this;

    this.elems.push(elem);
    this.end = elem.end;
    this.j++;
  }

  pop(){
    if(this.elems.length === 0) return null;

    const {elems} = this.def.pats[this.i];
    while(elems[--this.j].isTerm());

    var elem = this.elems.pop();
    this.end = elem.start;

    return elem;
  }

  next(stack){
    var pd = this;

    while(pd.elems.length !== 0){
      var elem = pd.pop();
      stack.push(elem);
      pd = elem;
    }

    pd.i++;
    pd.j = 0;
    pd.end = pd.start;
  }

  iter(names, func=null){
    if(func === null)
      [names, func] = [[], names];

    var queue = [this];

    while(queue.length !== 0){
      var pd = queue.shift();

      if(names.includes(pd.def.name))
        func(pd);

      for(var elem of pd.elems)
        queue.push(elem);
    }
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