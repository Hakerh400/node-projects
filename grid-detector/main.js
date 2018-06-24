'use strict';

var fs = require('fs');
var path = require('path');
var https = require('https');
var O = require('../framework');
var media = require('../media');
var conv = require('../color-converter');
var tempDir = require('../temp-dir')(__filename);
var detector = require('.');

var cwd = __dirname;

var url = 'https://user-images.githubusercontent.com/13399152/41824187-9989dc8c-780c-11e8-8656-55e3645e00ff.png';
var inputFile = path.join(tempDir, 'input.png');
var outputFile = path.join(cwd, 'output.txt');

var s = 40;

var cols = {
  wall: conv.color('#808080'),
};

setTimeout(main);

async function main(){
  var baseImg = await getBaseImg();
  var blockImg = await getBlockImg();

  var grid = await detect(baseImg, blockImg);
  await save(grid);
}

async function getBlockImg(){
  var [w, h] = [s, s];
  var g = media.createContext(w, h);
  g = new O.EnhancedRenderingContext(g);

  g.fillStyle = cols.wall;
  g.beginPath();
  g.rect(0, 0, w, h);
  g.fill();
  g.stroke();

  return g.canvas;
}

async function detect(baseImg, blockImg){
  var grid = detector.detect(baseImg, blockImg);
  return grid;
}

async function save(grid){
  var str = grid.stringify((x, y, d) => {
    return d ? '#' : ' ';
  });

  fs.writeFileSync(outputFile, str);
}

async function getBaseImg(){
  await downloadBaseImg();

  return new Promise(res => {
    var canvas;

    media.editImage(inputFile, '-', (w, h, g) => {
      canvas = g.canvas;
    }, () => {
      res(canvas);
    });
  });
}

async function downloadBaseImg(){
  await download(url, inputFile);
}

async function download(url, file){
  await new Promise(res => {
    https.get(url, r => {
      var stream = fs.createWriteStream(file);
      r.pipe(stream);

      r.on('end', () => {
        res();
      });
    });
  });
}