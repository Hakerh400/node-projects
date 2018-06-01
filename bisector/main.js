'use strict';

var O = require('../framework');
var bisector = require('.');

setTimeout(main);

function main(){
  var charCode = bisector.bisect(charCode => {
    var isValid = false;

    try{
      new Function(`'\\u{${charCode.toString(16)}}'`);
      isValid = true;
    }catch(e){};

    return isValid;
  });

  var str = `'\\u{${charCode.toString(16).toUpperCase()}}'`;

  console.log(str);
}