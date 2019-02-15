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

class Code extends Section{
  constructor(){
    super();

    this.func = null;
  }

  setFunc(args, code){
    if(typeof args === 'function'){
      this.func = args;
      return;
    }

    const func = new Function(args.join(', '), code);
    this.func = func;
  }
};

class Before extends Code{
  constructor(){
    super();
  }

  static name(){ return 'before'; }
};

class Inside extends Code{
  constructor(){
    super();
  }

  static name(){ return 'inside'; }
};

class After extends Code{
  constructor(){
    super();
  }

  static name(){ return 'after'; }
};

Section.Match = Match;
Section.Include = Include;
Section.Exclude = Exclude;
Section.Before = Before;
Section.Inside = Inside;
Section.After = After;

module.exports = Section;