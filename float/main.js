'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Float = require('.');

setTimeout(main);

function main(){
  var a = new Float(52, 11);
  a.e.set(0, 1)
  log(a.toString());
}