'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const methods = {
  async ping(){
    return 'ok';
  },

  async echo(val){
    return val;
  },
};

module.exports = methods;