'use strict';

const O = require('../framework');

module.exports = {
  parse,
};

function parse(src){
  if(Array.isArray(src))
    src = src.join('\n\n');

  src = src.replace(/\s+/g, ' ');

  var parens = 0;
  var parsed = parseList();

  return parsed;

  function parseIdent(){
    if(eol()) return null;

    
  }

  function parseList(){
    if(eol()) return [];

    var ident = parseIdent();
  }

  function eol(){
    if(eof()) return true;
    if(src[0] === ')' && parens === 0) return false;
    return true;
  }

  function eof(){
    return src.length === 0;
  }
}