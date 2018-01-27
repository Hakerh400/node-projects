'use strict';

var media = require('.');

var w = 44100;
var duration = 60;
var framesNum = duration;

var v = 0;

media.renderAudio('-dw/1.mp3', w, (w, d, f) => {
  logStatus(f, framesNum);
  f--;

  var dx = 1 / w;
  var s = dx * Math.PI * 2;

  for(var i = 0; i < w; i++){
    var a1 = 200;
    v += Math.sin(i * s * a1 + Math.PI / 2) * s * a1;
    d.writeFloatLE(v, i << 2);
  }

  return ++f != framesNum;
});

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

function logStatus(f, n){
  if(!logStatus.t) logStatus.t = Date.now();
  log(`Processing frame ${f} of ${n}. Time remaining: ${formatTime(calcTime(logStatus.t, f, n))}`);
};

function log(...a){
  console.log(...a);
  return a[a.length - 1];
}