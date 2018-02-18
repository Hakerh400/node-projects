'use strict';

var {Canvas} = require('../media/node_modules/canvas');

module.exports = colToRgb;

function colToRgb(col){
  if(!colToRgb.g){
    colToRgb.g = new Canvas(1, 1).getContext('2d');
  }

  var g = colToRgb.g;
  
  g.fillStyle = '#000000';
  g.fillStyle = col;

  col = g.fillStyle.match(/[0-9a-z]{2}/g);
  col = col.map(byte => parseInt(byte, 16));

  return [...col];
}