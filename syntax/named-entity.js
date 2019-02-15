'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class NamedEntity{
  constructor(){}

  static name(){ O.virtual('name', 1); }
  name(){ return this.constructor.name(); }
};

module.exports = NamedEntity;