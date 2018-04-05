'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var logStatus = require('../log-status');

const MAX_DIM = 100;
const MAX_DIM1 = MAX_DIM - 1;

var input = path.normalize('C:/Users/Thomas/Downloads/Levels');
var output = path.normalize('C:/wamp/www/projects/games/levels/sokoban');

setTimeout(main);

function main(){
  convertLevels();
}

function convertLevels(){
  if(fs.existsSync(output)) fsRec.deleteFilesSync(output);
  fs.mkdirSync(output);

  var files = fs.readdirSync(input);

  files.forEach((file, index) => {
    logStatus(index + 1, files.length, 'file');

    var filePath = path.join(input, file);
    var data = fs.readFileSync(filePath);
    var str = data.toString();

    var levels = str.split(/<\s*\/level\s*>/i);
    levels.pop();

    levels.forEach(level => {
      var str = '';

      level.replace(/<\s*l\s*>([^<]*)/gi, (a, b) => {
        if(str.length !== 0) str += '\n';
        str += b;
      });;

      convertLevel(str);
    });
  });
}

function convertLevel(level){
  if(!(O.static in convertLevel)){
    var obj = Object.create(null);
    convertLevel[O.static] = obj;
    obj.num = 0;
  }

  var obj = convertLevel[O.static];
  var num = ++obj.num;
  var lines = O.sanl(level);

  var w = lines.reduce((a, b) => Math.max(a, b.length), 0);
  var h = lines.length;

  var bs = new O.BitStream();

  bs.write(w - 1, MAX_DIM1);
  bs.write(h - 1, MAX_DIM1);

  for(var y = 0; y < h; y++){
    for(var x = 0; x < w; x++){
      var char = lines[y][x];
      var d = [0, 0, 0, 0];

      switch(char){
        case '@': d[0] = 1; break;
        case '$': d[1] = 1; break;
        case '.': d[2] = 1; break;
        case '#': d[3] = 1; break;
        case '+': d[0] = d[2] = 1; break;
        case '*': d[1] = d[2] = 1; break;
      }

      exportTile(x, y, d, bs);
    }
  }

  var fileName = `${num}.txt`;
  var filePath = path.join(output, fileName);

  fs.writeFileSync(filePath, bs.stringify(true));
}

function exportTile(x, y, d, bs){
  if(d[3]) return bs.write(1, 1);
  bs.write(0, 1);
  bs.write(d[2], 1);
  if(d[1]) return bs.write(1, 1);
  bs.write(0, 1);
  bs.write(d[0], 1);
}