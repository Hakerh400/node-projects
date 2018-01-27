'use strict';

var proc = require('./process.js');
var debug = require('./debug.js');

module.exports = {
  kill
};

function kill(cb){
  debug.info('Killing Chrome process.');
  proc.kill('chrome.exe', cb);
}