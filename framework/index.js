'use strict';

var fs = require('fs');
var browser = require('../browser');
var dirs = require('./dirs.json');
var password = require('./password.json');

var O = getFramework();

module.exports = O;

function getFramework(){
  var str = fs.readFileSync(dirs.O).toString();
  str = str.split(/\r\n|\r|\n/);
  str[str.length - 1] = 'return O;';
  str = str.join`\n`;

  var func = new Function('window', 'document', str);
  var window = new browser.Window();
  var document = window.document;

  var O = func(window, document);
  O.dirs = dirs;
  O.password = password;

  return O;
}