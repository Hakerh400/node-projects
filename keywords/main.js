'use strict';

var fs = require('fs');
var O = require('../framework');
var identGenerator = require('../ident-generator');
var logStatus = require('../log-status');
var formatFileName = require('../format-file-name');

const START_CHAR = 'a';
const CHARS_NUM = 26;

var maxLen = 4;
var chunkSize = 100;

var file = '-dw/1.txt';

var chars = generateChars(START_CHAR, CHARS_NUM);
var totalNum = CHARS_NUM ** maxLen;
var chunksNum = Math.ceil(totalNum / chunkSize);

var chunkIndex = 0;
var index = 0;

var keywords = [];

setTimeout(main);

function main(){
  processChunk();
}

function processChunk(){
  logStatus(++chunkIndex, chunksNum, 'chunk');

  var end = Math.min(index + chunkSize, totalNum);

  for(var j = index; j < end; j++){
    if(checkIdent(j)){
      keywords.push(genIdent(j));
    }
  }

  index = end;

  if(index < totalNum){
    setTimeout(processChunk);
  }else{
    setTimeout(saveKeywords);
  }
}

function saveKeywords(){
  var fileName = formatFileName(file);
  var str = keywords.join`\n`;

  fs.writeFileSync(fileName, str);
}

function checkIdent(i){
  var ident = genIdent(i);
  var code = `'use strict';var ${ident}`;

  try{
    new Function(code);
    return false;
  }catch(e){
    return true;
  }
}

function genIdent(i){
  return identGenerator.generate(i + 1, chars)
}

function generateChars(start, len){
  return [
    O.ca(len, i => identGenerator.getCharOffset(start, i)),
    [],
  ];
}