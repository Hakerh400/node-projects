'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const gen = () => {
  const prog = new Program();

  const Base = new Class('Base');
  const Main = new Class('Main', [], Base.template());

  Main.addGeneric(new Template('A', Base.template()));
  Main.addGeneric(new Template('B', Main.template([
    new Template('X', Main.template()),
  ])));

  prog.addClass(Base);
  prog.addClass(Main);

  return prog;
};

class Program{
  constructor(classes=[]){
    this.classes = classes;
  }

  addClass(cref){
    this.classes.push(cref);
    return this;
  }

  toString(){
    return this.classes.join('\n\n');
  }
}

class Class{
  constructor(name=null, generics=[], ext=null, attribs=[], methods=[]){
    this.name = name;
    this.generics = generics;
    this.extends = ext;
    this.attribs = attribs;
    this.methods = methods;
  }

  get isBase(){ return this.extends === null; }
  get isExtended(){ return this.extends !== null; }
  get isGeneric(){ return this.generics.length !== 0; }

  addGeneric(generic){
    this.generics.push(generic);
    return this;
  }

  addAttrib(attrib){
    this.attribs.push(attrib);
    return this;
  }

  addMethod(method){
    this.methods.push(method);
    return this;
  }

  template(generics){
    return new TemplatedClass(this, generics);
  }

  toString(){
    let s = `class ${this.name}`;
    if(this.isGeneric) s += `<${this.generics.join(', ')}>`;
    if(this.isExtended) s += ` extends ${this.extends}`;
    s += `{\n${' '.repeat(2)}/**/\n}`;
    return s;
  }
}

class TemplatedClass{
  constructor(cref, templates){
    this.class = cref;
    this.templates = templates;
  }

  addTemplate(template){
    this.templates.push(template);
    return this;
  }

  toString(){
    const {class: cref} = this;
    let s = cref.name;
    if(this.isGeneric) s += `<${this.templates.join(', ')}>`;
    return s;
  }
}

class Template{
  constructor(name=null, ext=null){
    this.name = name;
    this.ext = ext;
  }

  toString(){
    const {name, ext} = this;
    let s = name;
    if(ext.class.isExtended) s += ` extends ${ext}`;
    return s;
  }
}

module.exports = {
  gen,
};