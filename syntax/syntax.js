'use strict';

const fs = require('fs');
const path = require('path');
const v8 = require('v8');
const O = require('../omikron');
const debug = require('../debug');

const DISPLAY_CHARACTER_INDEX = 0;

const MAX_DEPTH = 30;

class Syntax{
  constructor(src){
    this.defs = O.obj();

    this.parseSrc(src);
  }

  parseSrc(src){
    O.sanll(src).forEach(src => {
      var lines = O.sanl(src);
      var name = lines.shift();

      var sects = {};
      var sect = 'pats';
      sects[sect] = [];

      for(var line of lines){
        if(!/^\s+/.test(line)){
          sect = line;
          sects[sect] = [];
          continue;
        }

        line = line.trimLeft();
        for(line of line.split(' | '))
          sects[sect].push(line);
      }

      var def = this.getDef(name);
      def.setPats(this.parsePats(sects.pats));
      if('before' in sects) def.setBefore(sects.before.join('\n'));
      if('after' in sects) def.setAfter(sects.after.join('\n'));
    });
  }

  parsePat(line){
    if(line === '/') line = '';

    var elems = line.match(/"(?:\\.|[^"])*"[\?\*\+]?|\S+/gs);
    if(elems === null) elems = [];

    return new Pattern(elems.map(str => {
      if(O.last(str) === '"'){
        str = JSON.parse(str);
        return new Terminal(str);
      }

      return new NonTerminal(this.getDef(str));
    }));
  }

  parsePats(pats){
    return pats.map(line => this.parsePat(line))
  }

  setDef(name, def){
    this.defs[name] = def;
  }

  getDef(name){
    const {defs} = this;

    if(!(name in defs)){
      var def = new Definition(name);
      this.setDef(name, def);

      var name1 = name.slice(0, name.length - 1);
      var pats;

      switch(name.slice(-1)){
        case '?':
          pats = ['/', name1];
          break;

        case '*':
          pats = ['/', `${name1} ${name}`];
          break;

        case '+':
          pats = [name1, `${name1} ${name}`];
          break;

        default:
          if(name.length === 3 && name[1] === '-'){
            var c1 = O.cc(name[0]);
            var c2 = O.cc(name[2]);

            pats = O.ca(c2 - c1 + 1, i => {
              return JSON.stringify(O.sfcc(c1 + i));
            });
            break;
          }

          return defs[name];
      }

      def.setPats(this.parsePats(pats));
    }

    return defs[name];
  }

  parse(str, name){
    var lines = O.sanl(str);
    str = lines.join('\n');

    const {defs} = this;
    const getDef = this.getDef.bind(this);
    const strObj = new String(str);

    var len = 0;
    var indices = lines.map(line => {
      var prev = len;
      len += line.length + 1;
      return prev;
    });

    var index = -1;
    var scope = null;

    const stack = new Stack;
    push(name);

    var t = Date.now();

    while(1){
      var pd = O.last(stack);

      if(pd.end > index){
        index = pd.end;
        scope = stack.map(pd => pd.def.name).join('\n');
      }

      //debug(stack.map(pd => pd.def.name).join('\n')+'\n---> '+JSON.stringify(str.slice(0, pd.end))+'\n');

      if(0&&Date.now() - t > 3e3){
        var lineIndex = indices.findIndex(i => index < i) - 1;
        var j = index - indices[lineIndex];

        log(`\n${name}:${lineIndex + 1}${
          DISPLAY_CHARACTER_INDEX ? `:${j + 1}` : ''
        }\n${lines[lineIndex]}\n${
          ' '.repeat(j)
        }^\n`);

        t = Date.now();
      }

      if(stack.depth > MAX_DEPTH || pd.i === pd.def.pats.length){
        if(stack.length === 1) break;

        stack.pop()
        pd = O.last(stack);
        next();

        continue;
      }

      var pat = pd.def.pats[pd.i];

      if(pd.j === 0 && pd.def.before !== null && !pd.before(stack)){
        next();
        continue;
      }

      if(pd.j === pat.elems.length){
        if(pd.def.after !== null && !pd.after(stack)){
          next();
          continue;
        }

        if(stack.length === 1){
          if(pd.end !== str.length){
            next();
            continue;
          }
          return pd;
        }

        stack.pop();
        O.last(stack).push(pd);

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

    var lineIndex = indices.findIndex(i => index < i) - 1;
    var j = index - indices[lineIndex];

    log(`${name}:${lineIndex + 1}${
      DISPLAY_CHARACTER_INDEX ? `:${j + 1}` : ''
    }\n${lines[lineIndex]}\n${
      ' '.repeat(j)
    }^\n\n${scope}`);
    O.proc.exit(0);

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

class Stack extends Array{
  constructor(){
    super();

    this.depth = 0;
  }

  push(pd){
    super.push(pd);
    if(!pd.def.isArr) this.depth++;
  }

  pop(){
    var pd = super.pop();
    if(!pd.def.isArr) this.depth--;
  }
};

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

    if(parent === null) this.state1 = v8.serialize({});
    else this.state1 = parent.state2;
    this.state2 = this.state1;
  }

  before(stack){
    var state = v8.deserialize(this.state2);
    var ok = this.def.before(O, stack, state, this.elems.map(e => e.toString()));
    this.state2 = v8.serialize(state);
    return ok;
  }

  after(stack){
    var state = v8.deserialize(this.state2);
    var ok = this.def.after(O, stack, state, this.elems.map(e => e.toString()), this.toString());
    this.state2 = v8.serialize(state);
    return ok;
  }

  push(elem){
    this.elems.push(elem);
    this.end = elem.end;
    this.state2 = elem.state2;
    this.j++;
  }

  pop(){
    if(this.elems.length === 0) return null;

    const {elems} = this.def.pats[this.i];
    while(elems[--this.j].isTerm());

    var elem = this.elems.pop();
    this.end = elem.start;
    this.state2 = elem.state1;

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
    pd.state2 = pd.state1;
  }

  iter(names, func=null){
    if(func === null)
      [names, func] = [[], names];

    if(!Array.isArray(names))
      names = [names];

    var queue = [this];

    while(queue.length !== 0){
      var pd = queue.shift();

      if(names.includes(pd.def.name))
        func(pd);

      for(var elem of pd.elems)
        queue.push(elem);
    }
  }

  copy(){
    var pd = new Parsed(this.str, this.parent, this.def);

    pd.start = this.start;
    pd.end = this.end;
    pd.i = this.i;
    pd.j = this.j;
    pd.elems = this.elems.map(pd => pd.copy());
    pd.state1 = this.state1;
    pd.state2 = this.state2;

    return pd;
  }

  set(str){
    this.str = str;
    this.start = 0;
    this.end = str.length;
  }

  toString(){
    return this.str.slice(this.start, this.end);
  }
};

class Definition{
  constructor(name){
    this.name = name;

    this.pats = null;
    this.before = null;
    this.after = null;

    this.isArr = /[\+\*\#]$/.test(name);
  }

  setPats(pats){ this.pats = pats; }
  setBefore(before){ this.before = Definition.makeCb(before); }
  setAfter(after){ this.after = Definition.makeCb(after, 1); }

  static makeCb(code, match=0){
    code = `${code};return 1`;

    var args = ['O', 'stack', 's', 'es'];
    if(match) args.push('m');

    return new Function(...args, code);
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