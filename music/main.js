'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const music = require('.');

const song = 'test';

setTimeout(main);

function main(){
  var cwd = process.cwd();
  var base = path.join(cwd, 'songs');
  base = path.join(base, song);

  music.render(`${base}.txt`, `${base}.mp3`);
}