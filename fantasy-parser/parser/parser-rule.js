'use strict';

const assert = require('assert');
const O = require('omikron');
const Parser = require('../parser');
const Section = require('./section');

class ParserRule{
  nterm = null;
  sections = new Map();
  section = new Section();

  constructor(parser){
    this.parser = parser;
  }

  setNterm(nterm){
    assert(this.nterm === null, nterm);
    this.nterm = nterm;
  }

  openSection(lab){
    const {sections, section} = this;

    assert(section !== null);

    if(section.hasLab){
      this.closeSection();
    }else{
      assert(section.isEmpty);
      this.section = null;
    }

    this.section = new Section(lab);
  }

  closeSection(){
    const {sections, section} = this;

    assert(section !== null);

    if(!section.hasLab)
      section.setLabel(this.parser.getLabel(this.nterm.name));

    assert(!sections.has(section.lab, section));
    sections.set(section.lab, section);

    this.section = null;
  }

  addElem(elem){
    this.section.addElem(elem);
  }
}

module.exports = ParserRule;