'use strict';

const assert = require('assert');
const O = require('omikron');

class Section{
  elems = [];

  constructor(lab=null){
    this.lab = lab;
  }

  get hasLab(){ return this.lab !== null; }
  get len(){ return this.elems.length; }
  get isEmpty(){ return this.elems.length === 0; }

  addElem(elem){
    this.elems.push(elem);
  }

  setLabel(lab){
    assert(this.lab === null);
    this.lab = lab;
  }
}

module.exports = Section;