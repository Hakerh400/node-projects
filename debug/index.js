'use strict';

const fs = require('fs');
const O = require('../framework');

const fdIn = process.stdin.fd;
const fdOut = process.stdout.fd;

const buff = Buffer.alloc(2);

module.exports = debug;

function debug(...args){
  var str = O.inspect(args);

  fs.writeSync(fdOut, `${str}\n`);
  fs.readSync(fdIn, buff, 0, 2);
}