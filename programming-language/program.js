'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const PL = require('./programming-language');

class Program extends SG{
  constructor(langName, maxSize){
    const lang = PL.get(langName);
    const graphCtors = lang.graphCtors;
    const graphRefs = lang.graphRefs;

    super(graphCtors, graphRefs, maxSize);
  }

  tick(){

  }
};

module.exports = Program;