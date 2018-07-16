'use strict';

const O = require('../framework');

function parse(src){
  if(Array.isArray(src)) src = src.join('\n\n');
  src = src.replace(/\s+/g, '');

  var source = new Source();
  var m;

  while(src.length){
    if(match(/(\w+)\:/) !== null){
      var name = m[1];

      var ident = new Ident(name);
      var func = parseFuncDef();
      var def = new Definition(ident, func);

      match(/\;/);
      source.push(def);
    }else{
      var elem = parseExpr();
      source.push(elem);
    }
  }

  log(source+'');

  function parseElem(){
    if(/^\w/.test(src)) return parseIdent();
    if(/^\(/.test(src)) return parseParens();
    if(/^\[/.test(src)) return parseFuncDef();

    err('element');
  }

  function parseIdent(){
    if(match(/\w+/) === null)
      err('identifier');

    var name = m[0];
    var ident = new Ident(name);

    return ident;
  }

  function parseParens(){
    if(match(/\(/) === null)
      err('list of elements');

    if(match(/\)/) !== null)
      return Ident.zero();

    var list = new ElemsList();

    while(!/^\)/.test(src)){
      var expr = parseExpr();
      list.push(expr);

      checkEof();
    }

    match(/\)/);

    return list;
  }

  function parseArgs(){
    var args = parseParens();
    if(args.isIdent()) args = new ElemsList();
    return args;
  }

  function parseExpr(){
    if(match(/[\,\;]/) !== null)
      return Ident.zero();

    var elem = parseElem();

    while(!/^[\,\;\)\}]/.test(src)){
      var args = parseArgs();
      elem = new Call(elem, args);

      checkEof();
    }

    match(/[\,\;]/);

    return elem;
  }

  function parseFuncDef(){
    if(match(/\[((?:\w+(?:\,\w+)*\,?)?)\]/) === null)
      err('function declaration');

    var names = m[1].replace(/[\,\;]/g, ' ').trim().split(' ');
    var idents = names.map(name => new Ident(name));

    var args = new ArgsList(idents);
    var body = parseFuncBody();
    var func = new Function(args, body);

    return func;
  }

  function parseFuncBody(){
    if(match(/\{/) === null)
      err('function body');

    var list = new ElemsList();

    while(!/^\}/.test(src)){
      var line = parseExpr();
      list.push(line);

      checkEof();
    }

    match(/\}/);

    return list;
  }

  function match(reg){
    m = src.match(reg);

    if(m === null) return null;
    if(m.index !== 0) return m = null;
    
    src = src.substring(m[0].length);

    return m;
  }

  function checkEof(){
    if(src.length === 0)
      e('Unexpected end of input');
  }

  function err(msg){
    var str = src.substring(0, 100);
    str += '\n^\n';
    str += `Expected ${msg}`;

    e(str);
  }

  function e(msg){
    log(msg);
    process.exit(1);
  }
}
Error.stackTraceLimit=1/0;

class Elem{
  constructor(){}

  isIdent(){ return false; }
  isDef(){ return false; }
  isList(){ return false; }
  isArgsList(){ return false; }
  isFunc(){ return false; }
  isCall(){ return false; }
  isSource(){ return false; }
};

class Ident extends Elem{
  constructor(name){
    super();
    this.name = name;
  }

  static zero(){
    return new Ident('0');
  }

  getName(){ return this.name; }
  isIdent(){ return true; }

  toString(){
    return this.name;
  }
};

class Definition extends Elem{
  constructor(ident, elem){
    super();
    this.ident = ident;
    this.val = elem;
  }

  getIdent(){ return this.ident; }
  getVal(){ return this.val; }
  isDef(){ return true; }

  toString(){
    return `${this.ident}:${this.val}`;
  }
};

class Function extends Elem{
  constructor(args, body){
    super();
    this.args = args;
    this.body = body;
  }

  getArgs(){ return this.args; }
  getBody(){ return this.body; }
  isFunc(){ return true; }

  toString(){
    return `[${this.args}]{${this.body}}`;
  }
};

class Call extends Elem{
  constructor(func, args){
    super();
    this.func = func;
    this.args = args;
  }

  getFunc(){ return this.func; }
  getArgs(){ return this.args; }
  isCall(){ return true; }

  toString(){
    return `${this.func}(${this.args})`;
  }
};

class ElemsList extends Elem{
  constructor(elems=[]){
    super();
    this.elems = elems;
  }

  push(elem){ this.elems.push(elem); }
  getElems(){ return this.elems; }
  isList(){ return true; }

  toString(){
    return this.elems.join(',');
  }
};

class ArgsList extends ElemsList{
  constructor(elems=[]){
    super(elems);
  }

  isArgsList(){ return true; }
};

class Source extends ElemsList{
  constructor(elems){
    super(elems);
  }

  isSource(){ return true; }
};

module.exports = {
  parse,
};