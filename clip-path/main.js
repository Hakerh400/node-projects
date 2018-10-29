'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const O = require('../framework');

const rl = readline.createInterface(process.stdin, process.stdout);

setTimeout(main);

async function main(){
  var arr = await getArr();
  var flat = O.flatten(arr);

  var [ax, ay, bx, by, cx, cy, dx, dy] = flat;

  var clipPath = [
    bx, by,  1, dy,
    dx,  1, cx, cy,
     0, ay, ax,
  ].reduce((clip, cNew, index) => {
    var coords = O.last(clip).slice();
    coords[index & 1] = cNew;
    clip.push(coords)
    return clip;
  }, [[ax, 0]]);

  var str = `clip-path: polygon(${
    clipPath.map(coords => {
      return coords.map(coord => {
        return `${Math.round(coord * 100)}%`;
      }).join(' ');
    }).join(', ')
  }) !important;`;

  log(str);
}

async function getArr(){
  var arr = await O.caa(4, async i => {
    return await n(i);
  });

  close();
  return arr;

  async function n(type){
    var x = type & 1;
    var y = type >> 1;

    var s1 = y === 0 ? 'Top' : 'Bottom';
    var s2 = x === 0 ? 'left' : 'right';

    var str = await ask(`${s1}-${s2}`);
    str = str.trim();

    if(str.length === 0){
      var [w, h] = [0, 0];
    }else{
      var arr = str.split(/\s+/);
      if(arr.length !== 2) err('Expected 2 numbers');

      arr = arr.map(a => Number(a) / 10);
      if(arr.some(a => isNaN(a))) err('Invalid number');

      var [w, h] = arr;
    }

    if(x === 0) w = Math.ceil(w);
    else w = Math.floor(100 - w);

    if(y === 0) h = Math.ceil(h);
    else h = Math.floor(100 - h);

    return [w, h].map(a => a / 100);
  }
}

function ask(prompt){
  return new Promise(res => {
    rl.question(`${prompt}: `, res);
  });
}

function close(newLine=1){
  rl.close();
  if(newLine) line();
}

function line(){
  log('');
}

function err(msg){
  line();
  log(`ERROR: ${msg}`);
  exit(1);
}

function exit(code){
  process.exit(code);
}