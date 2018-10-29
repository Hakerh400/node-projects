'use strict';

const path = require('path');
const music = require('.');

const song = 'test';

setTimeout(main);

function main(){
  var cwd = process.cwd();
  var base = path.join(cwd, 'songs');
  base = path.join(base, song);

  music.render(`${base}.txt`, `${base}.mp3`);
}