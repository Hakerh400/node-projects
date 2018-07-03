'use strict';

const O = require('../framework');

module.exports = {
  assert,
  err,
};

function assert(bool, msg, section, line){
  if(!bool) err(msg, section, line);
}

function err(msg, section=null, line=null){
  if(section !== null){
    var lineStr = line !== null ? ` line ${line + 1}` : '';
    msg = `${msg} (section "${section}"${lineStr})`;
  }

  throw new SyntaxError(msg);
}