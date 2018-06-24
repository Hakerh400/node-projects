'use strict';

var O = require('../framework');

const INVISIBLE_CHAR = '\u202A';

module.exports = {
  escape,
};

function escape(str){
  str = str.trim();

  str = str.split('').map(char => {
    if(/[\r\n]/.test(char))
      return char;

    if(char === ' ')
      return '&nbsp;';

    var hex = char.charCodeAt(0).toString(16);
    var esc = `&#x${hex};`;

    if(char === '@')
      esc += INVISIBLE_CHAR;

    return esc;
  }).join('');

  str = str.replace(/\r\n|\r|\n/g, '<br>');

  return str;
}