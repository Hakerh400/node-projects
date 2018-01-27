'use strict';

module.exports = logStatus;

function calcTime(t, f, n){
  var dt = Date.now() - t;
  var remaining = dt * (n - f + 1) / f;

  return remaining / 1e3 + .5 | 0;
};

function formatTime(t){
  var h = `${t / 3600 | 0}`.padStart(2, '0');
  var m = `${t / 60 % 60 | 0}`.padStart(2, '0');
  var s = `${t % 60 | 0}`.padStart(2, '0');

  return `${h}:${m}:${s}`;
};

function logStatus(f, n, type = 'frame'){
  if(!logStatus.t) logStatus.t = Date.now();
  log(`Processing ${type} ${f} of ${n}. Time remaining: ${formatTime(calcTime(logStatus.t, f, n))}`);
};

function log(...a){
  console.log(...a);
  return a[a.length - 1];
}