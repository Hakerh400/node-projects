'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');
const logSync = require('../log-sync');

const MAX_STR_LEN = 160;

var startTime = null;

logStatus.reset = reset;

module.exports = logStatus;

function logStatus(f, n=null, type='frame'){
  if(startTime === null)
    startTime = Date.now();

  var isSizeKnown = n !== null;

  var msgs = [
    `Processing ${type} ${format.num(f)}${isSizeKnown ? ` out of ${format.num(n)}` : ``}`,
    ...isSizeKnown ? [`ETA: ${format.time(calcTime(startTime, f, n))}`] : [],
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

  logSync(str);
}

function reset(){
  startTime = null;
}