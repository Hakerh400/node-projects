'use strict';

var formatNumber = require('../format-number');
var formatTime = require('../format-time');

var startTime = null;

module.exports = logStatus;

function logStatus(f, n, type = 'frame'){
  if(startTime === null){
    startTime = Date.now();
  }

  var isSizeKnown = n !== null;

  var msgs = [
    `Processing ${type} ${formatNumber(f)}${isSizeKnown ? ` of ${formatNumber(n)}` : ``}`,
    ...isSizeKnown ? [`Time remaining: ${formatTime(calcTime(startTime, f, n))}`] : [],
  ];

  console.log(msgs.join`  `);
};

function calcTime(t, f, n){
  var dt = Date.now() - t;
  var remaining = dt * (n - f + 1) / f;
  return remaining / 1e3 + .5 | 0;
};