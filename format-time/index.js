'use strict';

module.exports = formatTime;

function formatTime(t){
  var h = `${t / 3600 | 0}`.padStart(2, '0');
  var m = `${t / 60 % 60 | 0}`.padStart(2, '0');
  var s = `${t % 60 | 0}`.padStart(2, '0');

  return `${h}:${m}:${s}`;
};