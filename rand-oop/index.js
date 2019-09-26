'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const check = require('./check');
const Source = require('./source');
const Collection = require('./collection');
const rand = require('./rand');
const names = require('./names');

const ok = assert.ok;
const eq = assert.strictEqual;

const gen = () => {
  const prog = new Program();

  const baseClass = new Class('Base');
  baseClass.addDefCtor();
  prog.addClass(baseClass);

  const toType = (cref, gens=0, iter=1) => {
    return cref.toType(O.ca(cref.generics.len, () => {
      while(1){
        if(gens.len !== 0 && rand.pickGeneric) return gens.randElem();

        const cref = prog.classes.randElem();
        if(iter === 1 && cref.generics.len !== 0) continue;

        return toType(cref, gens, iter + 1);
      }
    }));
  };

  for(const i of O.repeatg(rand.classesNum)){
    const gensArr = O.ca(rand.genericsNum, i => new GenericType(names.generic(i)));
    const cref = new Class(names.class(i), gensArr);
    const gens = cref.generics;

    const ext = toType(prog.classes.randElem(), cref.generics);
    cref.addExt(ext);

    const randType = () => {
      if(gens.len !== 0 && rand.pickGeneric) return gens.randElem();
      return toType(prog.classes.randElem(), cref.generics)
    };

    if(ext.templates.len === 0 && O.rand(2)){
      const ctor = new Constructor(cref);

      for(const i of O.repeatg(rand.argsNum))
        ctor.addArg(new Argument(names.arg(i), randType()));

      ctor.addStat(new InlineComment('Non-default'));
      // ctor.addStat(new SuperConstructor());
      cref.addCtor(ctor);
    }else{
      cref.addDefCtor();
    }

    prog.addClass(cref);
  }

  return prog;
};

class Element{
  eq(elem){
    if(O.proto(this) !== O.proto(elem)) return 0;
    const lang = 'java';
    return new Source(lang).add(this).toString() === new Source(lang).add(elem).toString();
  }

  toString(src){ O.virtual('toString'); }
}

class Program extends Element{
  constructor(){
    super();

    this.classes = new Collection(Class);
  }

  addClass(cref){
    this.classes.add(cref);
  }

  toString(src){
    const {classes} = this;

    classes.forEach((cref, i) => {
      if(i !== 0) src.add('\n\n');
      src.add(cref);
    });

    return src;
  }
}

class Class extends Element{
  constructor(name, generics=[], ext=null){
    super();

    this.name = name;
    this.ext = check.elem(ext, Type, 1);

    this.generics = new Collection(generics, GenericType);
    this.attribs = new Collection(Attribute);
    this.ctor = null;
    this.methods = new Collection(Method);
  }

  get isBase(){ return this.ext === null; }
  get isExt(){ return this.ext !== null; }
  get isGeneric(){ return this.generics.len !== 0; }
  get hasCtor(){ return this.ctor !== null; }

  addGeneric(generic){
    this.generics.add(generic);
    return this;
  }

  addExt(ext){
    eq(this.ext, null);
    check.elem(ext, Type);

    let {cref} = ext;

    while(1){
      ok(cref !== this);
      const {ext} = cref;
      if(ext === null) break;
      cref = ext.cref;
    }

    this.ext = ext;
    return this;
  }

  addAttrib(attrib){
    this.attribs.add(attrib);
    return this;
  }

  addCtor(ctor){
    eq(this.ctor, null);

    ok(ctor.isCtor);
    eq(ctor.name, this.name);
    eq(ctor.ret.cref, this);
    
    this.ctor = check.elem(ctor, Method);
    return this;
  }

  addDefCtor(){
    const {name, ext} = this;
    const ctor = new Constructor(this);

    if(this.isExt){
      const {cref, templates} = ext;
      const {generics} = cref;

      for(const arg of cref.ctor.args)
        ctor.addArg(new Argument(arg.name, arg.type.template(generics, templates)));

      ctor.addStat(new SuperConstructor(ctor.args.map(arg => new Identifier(arg.name))));
    }

    return this.addCtor(ctor);
  }

  addMethod(method){
    ok(!method.isCtor);
    this.methods.add(method);
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
      generics.forEach((generic, i) => {
        if(i !== 0) src.add(', ');
        src.add(generic);
      });
      src.add('>');
    }

    if(this.isExt) src.add(' extends ').add(ext);
    src.add('{').inc().add('\n');

    for(const attrib of attribs) src.add(attrib).add('\n');
    if(attribs.len !== 0) src.add('\n');

    src.add(ctor).add('\n');
    for(const method of methods) src.add('\n').add(method).add('\n');

    return src.dec().add('}');
  }
}

class Type extends Element{
  get isGeneric(){ return 0; }
  template(generics, templates){ O.virtual('template'); }
}

class ClassType extends Type{
  constructor(cref, templates=[]){
    super();
    this.cref = check.elem(cref, Class);
    this.templates = new Collection(templates, Type, 0);
    eq(this.templates.len, cref.generics.len);
  }

  template(generics, templates){
    return new ClassType(this.cref, this.templates.map(type => type.template(generics, templates)));
  }

  toString(src){
    const {cref, templates} = this;
    src.add(cref.name);

    if(cref.isGeneric){
      src.add('<');
      templates.forEach((template, i) => {
        if(i !== 0) src.add(', ');
        src.add(template);
      });
      src.add('>');
    }

    return src;
  }
}

class GenericType extends Type{
  constructor(name){
    super();
    this.name = check.str(name);
  }

  get isGeneric(){ return 1; }

  template(generics, templates){
    const {name} = this;
    const index = generics.findIndex(gen => gen.name === name);

    if(index === -1) return new GenericType(name);

    const template = templates.get(index);
    if(template.isGeneric) return new GenericType(template.name)

    return template.template(generics, templates);
  }

  toString(src){
    return src.add(this.name);
  }
}

class Attribute extends Element{
  constructor(name, type){
    super();

    this.name = check.str(name);
    this.type = check.elem(type, Type);
  }

  toString(src){
    const {name, type} = this;
    return src.add(type).add(' ').add(name).add(';');
  }
}

class Method extends Element{
  constructor(cref, name, ret=null, args=[]){
    super();

    this.cref = cref;
    this.name = check.str(name);
    this.args = new Collection(args, Argument);
    this.ret = check.elem(ret, Type, 1);
    this.block = new Block(1);
  }

  get isVoid(){ return this.ret === null; }
  get isCtor(){ return 0; }
  get isGetter(){ return 0; }
  get isSetter(){ return 0; }
  get isSetterOrSetter(){ return this.isGetter || this.isSetter; }

  addStat(stat){
    if(stat instanceof SuperConstructor) ok(this.isCtor);
    this.block.addStat(stat);
  }

  addArg(arg){
    this.args.add(arg);
    return this;
  }

  toString(src){
    const {name, args, ret, block} = this;

    if(!this.isCtor){
      if(this.isVoid) src.add('void ');
      else src.add(ret).add(' ');
    }

    src.add(name).add('(');

    args.forEach((arg, i) => {
      if(i !== 0) src.add(', ');
      src.add(arg);
    });

    return src.add(')').add(block);
  }
}

class Constructor extends Method{
  constructor(cref){
    super(cref, cref.name, cref.toTemplateType());

    this.superCtor = null;
  }

  addStat(stat){
    if(stat instanceof SuperConstructor){
      ok(this.superCtor === null);
      this.superCtor = stat;
    }

    super.addStat(stat);
  }

  get isCtor(){ return 1; }
}

class Argument extends Element{
  constructor(name, type){
    super();

    this.name = check.str(name);
    this.type = check.elem(type, Type);
  }

  toString(src){
    const {name, type} = this;
    return src.add(type).add(' ').add(name);
  }
}

class Block extends Element{
  constructor(forceBraces=0, ifEmpty='{}'){
    super();

    this.stats = new Collection([], Statement, 0);
    this.forceBraces = forceBraces;
    this.ifEmpty = ifEmpty;
  }

  get isEmpty(){ return this.stats.len === 0; }
  get isSngl(){ return this.stats.len === 1; }
  get isMult(){ return this.stats.len > 1; }

  addStat(stat){
    this.stats.add(stat);
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
      if(i !== stats.len - 1 && wantsSpace) src.add('\n');
    });

    if(braces) src.dec().add('\n}');
    return src;
  }
}

class Statement extends Element{
  watsSpace(){ return 0; }
}

class Comment extends Statement{
  constructor(text){
    super();
    this.text = text;
  }
}

class InlineComment extends Comment{
  constructor(text){
    super(text);
  }

  toString(src){
    const {text} = this;
    return src.add('// ').add(text);
  }
}

class MultilineComment extends Comment{
  constructor(text){
    super(text);
  }

  toString(src){
    const {text} = this;
    if(text === '') return src.add('/**/');

    src.add('/*\n').inc();
    for(const line of O.sanl(text)) src.add(line).add('\n');
    src.dec().add('*/');

    return src;
  }
}

class SuperConstructor extends Statement{
  constructor(args=[]){
    super();
    this.args = new Collection(args, Identifier);
  }

  addArg(arg){
    this.args.add(arg);
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

class Identifier extends Element{
  constructor(name){
    super();

    this.name = check.str(name);
  }

  toString(src){
    return src.add(this.name);
  }
}

module.exports = {
  gen,
};