'use strict';

var fs = require('fs');
var formatNumber = require('../format-number');
var formatTime = require('../format-time');

const MAX_STR_LEN = 160;

var startTime = null;
var fd = process.stdout.fd;

module.exports = logStatus;

function logStatus(f, n = null, type = 'frame'){
  if(startTime === null)
    startTime = Date.now();

  var isSizeKnown = n !== null;

  var msgs = [
    `Processing ${type} ${formatNumber(f)}${isSizeKnown ? ` of ${formatNumber(n)}` : ``}`,
    ...isSizeKnown ? [`Time remaining: ${formatTime(calcTime(startTime, f, n))}`] : [],
    `FPS: ${formatInt(f / ((Date.now() - startTime) / 1e3))}`,
  ];

  log(msgs.join('  '));
}

function calcTime(t, f, n){
  var dt = Date.now() - t;
  var remaining = dt * (n - f + 1) / f;
  return formatInt(remaining / 1e3 + .5);
}

function formatInt(val){
  val = Math.floor(val);

  if(!(1 / val)) val = '-';
  else val = String(val);

  return val;
}

function log(str){
  if(str.length < MAX_STR_LEN){
    str += '\n';
  }else if(str.length > MAX_STR_LEN){
    str = `${str.substring(0, MAX_STR_LEN - 3)}...`;
  }

  fs.writeSync(fd, str);
}