'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var svg = require('.');

var cwd = __dirname;
var svgDir = O.dirs.dw;
var outputFile = path.join(cwd, 'output.js');

setTimeout(main);

function main(){
  var indent = 1;
  var codes = getCodes(indent);

  var src = codes.map(([name, w, h, code]) => {
    return O.indent(`['${name}', ${w}, ${h}, g => {\n${code}\n}],`, indent - 1);
  }).join('\n');

  fs.writeFileSync(outputFile, src);
}

function getCodes(indent){
  return fs.readdirSync(svgDir).map(fileName => {
    var name = path.parse(fileName).name;
    var filePath = path.join(svgDir, fileName);
    var src = fs.readFileSync(filePath, 'utf8');
    var [w, h, code] = svg.svg2ctx(src, 'g', indent);

    return [name, w, h, code];
  });
}