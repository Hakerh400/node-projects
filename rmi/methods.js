'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const methods = {
  async ping(){
    return new Promise((res, rej) => {
      setTimeout(() => {
        res('ok');
      }, 1e3);
    });
  },
};

module.exports = methods;