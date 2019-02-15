'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Pattern = require('./pattern');
const NamedEntity = require('./named-entity');

class Section extends NamedEntity{
  constructor(){
    super();
  }
};

class Match extends Section{
  constructor(){
    super();

    this.pats = [];
  }

  addPat(pat){ this.pats.push(pat); }
  len(){ return this.path.length; }
};

class Include extends Match{
  constructor(){
    super();
  }

  static name(){ return 'include'; }
};

class Exclude extends Match{
  constructor(){
    super();
  }

  static name(){ return 'exclude'; }
};

Section.Match = Match;
Section.Include = Include;
Section.Exclude = Exclude;

module.exports = Section;