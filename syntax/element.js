'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Range = require('./range');
const RangeSet = require('./range-set');
const NamedEntity = require('./named-entity');

class Element extends NamedEntity{
  constructor(){
    super();

    this.range = new Range(1, 1);
    this.greediness = 1;
    this.separator = null;
  }
};

class Terminal extends Element{
  constructor(){
    super();
  }
};

class NonTerminal extends Element{
  constructor(rule=null){
    super();

    this.rule = rule;
  }

  static name(){ return 'rule'; }
};

class String extends Terminal{
  constructor(){
    super();
  }

  static name(){ return 'string'; }
};

class CharsRange extends Terminal{
  constructor(range=null){
    super();

    this.set = new RangeSet(range);
  }

  static name(){ return 'charsRange'; }

  add(range){ this.set.add(range); }
  has(num){ return this.set.has(nul); }
  overlaps(range){ return this.set.overlaps(range); }
  isEmpty(){ return this.set.isEmpty(); }
};

Element.Terminal = Terminal;
Element.NonTerminal = NonTerminal;
Element.String = String;
Element.CharsRange = CharsRange;

module.exports = Element;