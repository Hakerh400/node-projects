'use strict';

var media = require('../media');
var ImageData = require('../image-data');
var logStatus = require('../log-status');
var WorldGenerator = require('.');
var tiles = require('./tiles.json');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 60 * 10;
var framesNum = fps * duration;

var mainSeed = Math.random();
var tileSize = 4;
var landSize = 32;

setTimeout(main);

function main(){
  var gen = new WorldGenerator(mainSeed, landSize);

  var [tx, ty] = [0, 0];

  var wh, hh;
  var d;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f == 1){
      [wh, hh] = [w, h].map(a => a >> 1);
      d = new ImageData(g);
    }

    tx = f;

    d.iterate((x, y, r, g, b) => {
      if(!((x + tx) % tileSize || (y + ty) % tileSize)){
        var tile = gen.getTile((x - wh + tx) / tileSize - landSize / 2 | 0, (y - hh + ty) / tileSize - landSize / 2 | 0);
        return getCol(tile);
      }else{
        return d.get(((x + tx % tileSize) / tileSize | 0) * tileSize - tx % tileSize, ((y + ty % tileSize) / tileSize | 0) * tileSize - ty % tileSize);
      }
    });

    d.put();

    return f != framesNum;
  });
}

function getCol(tile){
  return tiles.tiles[tile].col.substring(1).match(/../g).map(a => {
    return parseInt(a, 16);
  });
}