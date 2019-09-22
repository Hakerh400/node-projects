'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Source = require('./source');

const ok = assert.ok;
const eq = assert.strictEqual;

const check = (obj, type, allowNull=0) => {
  if(allowNull && obj === null) return obj;
  ok(obj instanceof type);
  return obj;
};

const checkStr = obj => {
  ok(typeof obj === 'string');
  return obj;
};

const checkArr = (arr, type) => {
  ok(Array.isArray(arr));
  for(const obj of arr) check(obj, type);
  return arr;
};

const gen = () => {
  const prog = new Program();

  const base = new Class('Base');
  {
    const ctor = new Constructor('Base', base.toType());
    ctor.addArg(new Argument('arg1', base.toType()));
    ctor.addArg(new Argument('arg2', base.toType()));
    base.addCtor(ctor);
  }
  prog.addClass(base);

  const main = new Class('Main', base.toType());
  {
    const gtype = new GenericType('T');
    main.addGeneric(gtype);
    const ctor = new Constructor('Main', main.toType([gtype]));
    ctor.addArg(new Argument('abc', main.toType([base.toType()])));
    ctor.addArg(new Argument('ddd', base.toType()));
    ctor.addArg(new Argument('test', main.toType([main.toType([gtype])])));
    main.addCtor(ctor);
  }
  prog.addClass(main);

  const gtype = new GenericType('X');
  const test = new Class('Test', main.toType([gtype]));
  test.addGeneric(gtype);
  test.addDefCtor();
  prog.addClass(test);

  return prog;
};

class Program{
  constructor(){
    this.classes = [];
  }

  addClass(cref){
    this.classes.push(check(cref, Class));
  }

  toString(src){
    const {classes} = this;

    for(let i = 0; i !== classes.length; i++){
      if(i !== 0) src.add('\n\n');
      src.add(classes[i]);
    }

    return src;
  }
}

class Class{
  constructor(name, ext=null){
    this.name = name;
    this.ext = check(ext, Type, 1);

    this.generics = [];
    this.attribs = [];
    this.ctor = null;
    this.methods = [];
  }

  get isBase(){ return this.ext === null; }
  get isExt(){ return this.ext !== null; }
  get isGeneric(){ return this.generics.length !== 0; }
  get hasCtor(){ return this.ctor !== null; }

  addGeneric(generic){
    this.generics.push(check(generic, Type));
    return this;
  }

  addAttrib(attrib){
    this.attribs.push(checkStr(attrib));
    return this;
  }

  addCtor(ctor){
    eq(this.ctor, null);

    ok(ctor.isCtor);
    eq(ctor.name, this.name);
    eq(ctor.ret.cref, this);
    
    this.ctor = check(ctor, Method);
    return this;
  }

  addDefCtor(){
    const {name, ext} = this;

    const ctor = new Constructor(name, this.toTemplateType());

    if(this.isExt){
      const {cref, templates} = ext;
      const {generics} = cref;

      for(const arg of cref.ctor.args)
        ctor.addArg(new Argument(arg.name, arg.type.template(generics, templates)));
    }

    ctor.block.addStat(new SuperConstructor(ctor.args.map(arg => new Identifier(arg.name))));

    return this.addCtor(ctor);
  }

  addMethod(method){
    ok(!method.isCtor);
    this.methods.push(check(method, Method));
    return this;
  }

  toType(templates=[]){
    return new ClassType(this, templates);
  }

  toTemplateType(){
    return this.toType(this.generics);
  }

  toString(src){
    const {name, ext, generics, attribs, ctor, methods} = this;
    ok(this.hasCtor);

    src.add('class ').add(this.name);

    if(this.isGeneric){
      src.add('<');
      for(const generic of generics) src.add(generic);
      src.add('>');
    }

    if(this.isExt) src.add(' extends ').add(ext);
    src.add('{').inc().add('\n');

    for(const attrib of attribs) src.add(attrib).add('\n');
    if(attribs.length !== 0) src.add('\n');

    src.add(ctor).add('\n');
    for(const method of methods) src.add('\n').add(method).add('\n');

    return src.dec().add('}');
  }
}

class Type{
  template(generics, templates){ O.virtual('template'); }
  toString(src){ O.virtual('toString'); }
}

class ClassType extends Type{
  constructor(cref, templates=[]){
    super();
    this.cref = check(cref, Class);
    this.templates = checkArr(templates, Type);
    eq(templates.length, cref.generics.length);
  }

  template(generics, templates){
    return new ClassType(this.cref, this.templates.map(type => type.template(generics, templates)));
  }

  toString(src){
    const {cref, templates} = this;
    src.add(cref.name);

    if(cref.isGeneric){
      src.add('<');
      for(const template of templates) src.add(template);
      src.add('>');
    }

    return src;
  }
}

class GenericType extends Type{
  constructor(name){
    super();
    this.name = checkStr(name);
  }

  template(generics, templates){
    const {name} = this;
    const index = generics.findIndex(gen => gen.name === name);

    if(index === -1) return new GenericType(name);
    return templates[index].template(generics, templates);
  }

  toString(src){
    return src.add(this.name);
  }
}

class Method{
  constructor(name, ret=null, args=[]){
    this.name = checkStr(name);
    this.args = checkArr(args, Argument);
    this.ret = check(ret, Type, 1);
    this.block = new Blobk(1);
  }

  get isVoid(){ return this.ret === null; }
  get isCtor(){ return 0; }
  get isGetter(){ return 0; }
  get isSetter(){ return 0; }
  get isSetterOrSetter(){ return this.isGetter || this.isSetter; }

  addArg(arg){
    this.args.push(check(arg, Argument));
    return this;
  }

  toString(src){
    const {name, args, ret, block} = this;

    if(!this.isCtor){
      if(this.isVoid) src.add('void ');
      else src.add(ret).add(' ');
    }

    src.add(name).add('(');

    for(let i = 0; i !== args.length; i++){
      if(i !== 0) src.add(', ');
      src.add(args[i]);
    }

    return src.add(')').add(block);
  }
}

class Constructor extends Method{
  constructor(name, ret){
    ok(ret !== null);
    super(name, ret);
  }

  get isCtor(){ return 1; }
}

class Argument{
  constructor(name, type){
    this.name = checkStr(name);
    this.type = check(type, Type);
  }

  toString(src){
    const {name, type} = this;
    return src.add(type).add(' ').add(name);
  }
}

class Blobk{
  constructor(forceBraces=0, ifEmpty='{}'){
    this.stats = [];
    this.forceBraces = forceBraces;
    this.ifEmpty = ifEmpty;
  }

  get isEmpty(){ return this.stats.length === 0; }
  get isSngl(){ return this.stats.length === 1; }
  get isMult(){ return this.stats.length > 1; }

  addStat(stat){
    this.stats.push(check(stat, Statement));
  }

  toString(src){
    const {stats} = this;
    if(this.isEmpty) return src.add(this.ifEmpty);

    const braces = this.forceBraces || this.isMult;
    if(braces) src.add('{\n').inc();

    stats.forEach((stat, i) => {
      const {wantsSpace} = stat;

      if(i !== 0){
        src.add('\n');
        if(wantsSpace) src.add('\n');
      }

      src.add(stat);
      if(i !== stats.length - 1 && wantsSpace) src.add('\n');
    });

    if(braces) src.dec().add('\n}');
    return src;
  }
}

class Statement{
  watsSpace(){ return 0; }
  toString(src){ O.virtual('toString'); }
}

class SuperConstructor extends Statement{
  constructor(args=[]){
    super();
    this.args = checkArr(args, Identifier);
  }

  addArg(arg){
    this.args.push(check(arg, Identifier));
    return this;
  }

  toString(src){
    const {args} = this;

    src.add('super(');

    args.forEach((arg, i) => {
      if(i !== 0) src.add(', ');
      src.add(arg);
    });

    return src.add(');');
  }
}

class Identifier{
  constructor(name){
    this.name = checkStr(name);
  }

  toString(src){
    return src.add(this.name);
  }
}

module.exports = {
  gen,
};