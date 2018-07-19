'use strict';

const O = require('../framework');

function parse(tokenized){
  var {tokens} = tokenized;
  var len = tokens.length;

  var parsed = [];
  var i, tk;

  push(1);

  for(i = 0; i !== len; i++){
    tk = tokens[i];

    switch(tk){
      case 0: push(1); break;
      case 1: pop(1); break;
      case 2: pop(0); break;

      default:
        push(0);
        top().ident = new Identifier(tk);
        break;
    }
  }

  while(parsed.length !== 1)
    pop();

  return new Parsed(parsed[0]);

  function push(mode){
    if(mode === 1) parsed.push(new List());
    else parsed.push(new CallChain());
  }

  function pop(mode){
    var elem = parsed.pop();
    top().push(elem);

    if(mode === 1 && elem.isCall()){
      var list = parsed.pop();
      top().push(list);
    }
  }

  function top(){
    return parsed[parsed.length - 1];
  }
}

class Element{
  constructor(){}

  isIdent(){ return false; }
  isList(){ return false; }
  isCall(){ return false; }
};

class Identifier extends Element{
  constructor(name){
    super();
    this.name = name;
  }

  toString(){
    return this.name;
  }

  isIdent(){ return true; }
};

class List extends Element{
  constructor(arr=[]){
    super();
    this.arr = [];
  }

  push(callChain){
    this.arr.push(callChain);
  }

  toString(){
    return `(${this.arr.join(',')})`;
  }

  isList(){ return true; }
};

class CallChain extends Element{
  constructor(ident=null, arr=[]){
    super();
    this.ident = ident;
    this.arr = arr;
  }

  push(list){
    this.arr.push(list);
  }

  toString(){
    return `${this.ident}${this.arr.join('')}`;
  }

  isCall(){ return true; }
}

class Parsed{
  constructor(list){
    this.list = list;
  }

  toString(){
    return this.list.toString();
  }
};

module.exports = {
  parse,
  Element,
  Identifier,
  List,
  CallChain,
  Parsed,
};