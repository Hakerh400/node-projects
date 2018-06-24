'use strict';

var O = require('../framework');
var ImageData = require('../image-data');

const DEFAULT_SIMILARITY = .9;

module.exports = {
  detect,
};

function detect(baseImg, blockImg, similarity=DEFAULT_SIMILARITY){
  var [w, h] = getWH(baseImg);
  var [ws, hs] = getWH(blockImg);
  var [wg, hg] = calcGridSize(w, h, ws, hs);

  var diffMax = ws * hs;
  var diffTh = 1 - similarity;

  var d1 = new ImageData(getContext(baseImg));
  var d2 = new ImageData(getContext(blockImg));

  var c1 = Buffer.alloc(3);
  var c2 = Buffer.alloc(3);

  var grid = createGrid(wg, hg, (x, y) => {
    var x1 = x * ws;
    var y1 = y * hs;

    var diff = 0;

    for(var j = 0; j !== hs; j++){
      for(var i = 0; i !== ws; i++){
        d1.get(x1 + i, y1 + j, c1);
        d2.get(i, j, c2);

        diff += calcDiff(c1, c2, false);
      }
    }

    diff = Math.sqrt(diff / diffMax);
    var match = diff <= diffTh;

    return match;
  });

  return grid;
}

function createGrid(w, h, func){
  var grid = O.ca(h, y => {
    return O.ca(w, x => {
      return func(x, y);
    });
  });

  grid.stringify = (func, s1='', s2='\n') => {
    return grid.map((row, y) => {
      return row.map((d, x) => {
        return func(x, y, d);
      }).join(s1);
    }).join(s2);
  };

  return grid;
}

function calcDiff(c1, c2, takeSqrt=true){
  var dr = c2[0] - c1[0];
  var dg = c2[1] - c1[1];
  var db = c2[2] - c1[2];

  var diff = (dr * dr + dg * dg + db * db) / (255 * 255 * 3);
  if(takeSqrt) diff = Math.sqrt(diff);

  return diff;
}

function calcGridSize(w, h, ws, hs){
  var wg = Math.round(w / ws);
  var hg = Math.round(h / hs);

  return [wg, hg];
}

function getWH(img){
  var w = img.width;
  var h = img.height;

  return [w, h];
}

function getContext(img){
  return img.getContext('2d');
}