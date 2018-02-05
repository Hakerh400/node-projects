'use strict';

var formatTime = require('../format-time');

module.exports = logStatus;

function calcTime(t, f, n){
  var dt = Date.now() - t;
  var remaining = dt * (n - f + 1) / f;

  return remaining / 1e3 + .5 | 0;
};

function logStatus(f, n, type = 'frame'){
  if(!logStatus.t) logStatus.t = Date.now();
  log(`Processing ${type} ${f} of ${n}. Time remaining: ${formatTime(calcTime(logStatus.t, f, n))}`);
};

function log(...a){
  console.log(...a);
  return a[a.length - 1];
}