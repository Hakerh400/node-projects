'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Range = require('./range');
const RangeSet = require('./range-set');

class Element{
  constructor(){
    this.range = new Range(1, 1);
    this.greediness = 1;
    this.sep = null;
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
    this.ruleRange = new Range();
  }
};

class String extends Terminal{
  constructor(str=''){
    super();

    this.str = '';
  }
};

class CharsRange extends Terminal{
  constructor(range=null){
    super();

    this.set = new RangeSet(range);
  }

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