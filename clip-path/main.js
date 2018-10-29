'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const O = require('../framework');

const rl = readline.createInterface(process.stdin, process.stdout);

setTimeout(main);

async function main(){
  var a = await ask('Top-left');
  var b = await ask('Top-right');
  var c = await ask('Bottom-left');
  var d = await ask('Bottom-right');

  rl.close();
}

function ask(prompt){
  return new Promise(res => {
    rl.question(prompt, res);
  });
}