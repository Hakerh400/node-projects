'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const bisector = require('.');

const canvasDir = '-dw/bisect/canvas';

setTimeout(main);

function main(){
  var bisectInfo = bisector.bisect(canvasDir);
  log(bisectInfo.toString());
}