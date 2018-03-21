'use strict';

var O = require('../framework');
var logStatus = require('../log-status');
var formatNumber = require('../format-number');

setTimeout(main);

function main(){
  var maxStrLen = getMaxStrLen();

  console.log('');
  console.log(formatNumber(maxStrLen));
}

function getMaxStrLen(){
  var char = '\x00';
  var str = char;
  var stage = 0;

  var minLen;
  var maxLen;

  var f = 0;

  do{
    logStatus(++f, null, 'string');

    if(stage === 0){
      try{
        str += str;
      }catch(err){
        stage = 1;
        minLen = str.length;
        maxLen = minLen * 2;
      }
    }else{
      if(minLen === maxLen)
        break;

      var mid = Math.floor((minLen + maxLen) / 2);

      try{
        str = char.repeat(mid);
        minLen = mid + 1;
      }catch(err){
        maxLen = mid - 1;
      }
    }
  }while(1);

  return minLen;
}