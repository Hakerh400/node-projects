'use strict';

var O = require('../framework');

var nterms = {
  async main(s){
    await s.nterm(['expr']);
  },

  async expr(s){
    await s.nterm('digit');
    await s.nterm('op');
    await s.nterm('digit');
  },

  async digit(s){
    await s.term(/[0-9]/);
  },

  async op(s){
    await s.term(/[+\-*/]/);
  },
};

Object.setPrototypeOf(nterms, null);

module.exports = nterms;