'use strict';

var dllEditor = require('./dll-editor.js');

module.exports = {
  block,
  unblock
};

function block(cb){
  dllEditor.edit(true, cb);
}

function unblock(cb){
  dllEditor.edit(false, cb);
}