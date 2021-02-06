'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const rmi = require('../..');

class Tab{
  window = null;
  index = null;
  url = null;

  constructor(id){
    this.id = id;
  }
}

module.exports = Tab;