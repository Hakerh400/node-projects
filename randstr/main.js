'use strict';

const O = require('../omikron');
const readline = require('../readline');

var rl = readline.rl();

var chars = null;
var lens = null;
var strNum = null;

setTimeout(main);

function main(){
  aels();
  genRandStr();
}

function aels(){
  rl.on('sigint', exit);
}

function genRandStr(){
  rl.question('Character ranges: ', processRanges);
}

function processRanges(ranges){
  if(ranges === ''){
    exit();
    return;
  }

  if(ranges.length === 0) ranges = '  ';
  else if(ranges.length === 1) ranges += ranges[0];

  chars = [];

  ranges.match(/../g).forEach(([start, end]) => {
    [start, end] = [start, end].map(a => a.charCodeAt(0));

    O.repeat(end - start + 1, charCode => {
      chars.push(String.fromCharCode(start + charCode));
    });
  });

  rl.question('Minimal and maximal length: ', processLens);
}

function processLens(lengths){
  lens = lengths.split(' ').map(a => a | 0);
  if(lens.length === 1) lens.push(lens[0]);

  rl.question('Number of strings to generate: ', processStrNum);
}

function processStrNum(num){
  strNum = num | 0;

  displayStrings();
}

function displayStrings(){
  log('');

  O.repeat(strNum, () => {
    var len = lens[0] + O.rand(lens[1] - lens[0] + 1);
    var str = O.ca(len, () => chars[O.rand(chars.length)]).join('');

    log(str);
  });

  log('');
  genRandStr();
}

function exit(){
  rl.close();
}