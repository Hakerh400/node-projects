'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fsm = require('../fsm');

const main = () => {
  const reg = /ABC/;
  const str = fsm.genStr(fsm.reg(reg));
  
  log(str);
};

main();