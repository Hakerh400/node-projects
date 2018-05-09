'use strict';

var fs = require('fs');
var formatNumber = require('../format-number');
var formatTime = require('../format-time');

var startTime = null;

module.exports = logStatus;

function logStatus(f, n = null, type = 'frame'){
  if(startTime === null)
    startTime = Date.now();

  var isSizeKnown = n !== null;

  var msgs = [
    `Processing ${type} ${formatNumber(f)}${isSizeKnown ? ` of ${formatNumber(n)}` : ``}`,
    ...isSizeKnown ? [`Time remaining: ${formatTime(calcTime(startTime, f, n))}`] : [],
    `FPS: ${f / ((Date.now() - startTime) / 1e3) | 0}`,
  ];

  log(msgs.join('  '));
}

function calcTime(t, f, n){
  var dt = Date.now() - t;
  var remaining = dt * (n - f + 1) / f;
  return remaining / 1e3 + .5 | 0;
}

function log(str){
  str += '\n';
  fs.writeSync(process.stdout.fd, str);
}