'use strict';

var path = require('path');
var music = require('.');

var song = 'The Phantom of the Opera';

setTimeout(main);

function main(){
  var cwd = process.cwd();
  var base = path.join(cwd, 'songs');
  base = path.join(base, song);

  music.render(`${base}.txt`, `${base}.mp3`);
}