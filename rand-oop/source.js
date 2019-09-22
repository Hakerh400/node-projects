'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

class Source{
  constructor(lang, indent=0){
    this.lang = lang;
    this.indent = indent;
    this.str = TAB.repeat(indent);
  }

  inc(){
    this.indent++;
    return this;
  }

  dec(){
    this.indent--;
    return this;
  }

  add(str){
    if(typeof str !== 'string'){
      str.toString(this);
      return this;
    }

    if(str === '') return this;

    const tab = TAB.repeat(this.indent);
    const indent = `\n${tab}`;
    if(this.str.endsWith('\n')) this.str += tab;
    this.str += str.replace(/(?:\r\n|\r|\n)(.)/gs, (a, b) => indent + b);
    return this;
  }

  toString(){
    return this.str;
  }
}

module.exports = Source;