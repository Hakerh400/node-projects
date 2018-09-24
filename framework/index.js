'use strict';

const fs = require('fs');
const browser = require('../browser');
const dirs = require('./dirs.json');
const passwords = require('./passwords.json');

setGlobalVars();

module.exports = getFramework();

function setGlobalVars(){
  global.require = (...args) => {
    if(args.length !== 1)
      throw new TypeError('Expected 1 argument');
    
    var arg = args[0];
    if(typeof args[0] !== 'string')
      throw new TypeError('Expected a string');

    if(/[\.\/\\]/.test(arg))
      throw new TypeError('Expected a native module name');

    return require(arg);
  };
}

function getFramework(){
  var str = fs.readFileSync(dirs.O).toString();
  str = str.split(/\r\n|\r|\n/);
  str[str.length - 1] = 'return O;';
  str = str.join('\n');

  var func = new Function('window', 'document', str);
  var window = new browser.Window();
  var document = window.document;

  var O = func(window, document);
  O.init(0);

  O.dirs = dirs;
  O.passwords = passwords;
  O.password = passwords[0];

  return O;
}