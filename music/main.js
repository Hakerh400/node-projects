'use strict';

var path = require('path');
var music = require('.');

var song = 'Military Storm';

setTimeout(main);

function main(){
  var cwd = process.cwd();
  var base = path.join(cwd, 'songs');
  base = path.join(base, song);

  music.render(`${base}.txt`, `${base}.mp3`);
}