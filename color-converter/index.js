'use strict';

var {Canvas} = require('../media/node_modules/canvas');
var col2rgb = require('../col2rgb');

var g = new Canvas(1, 1).getContext('2d');

module.exports = {
  col2rgb,
  rgb2col,
};

function rgb2col(rgb){
  g.fillStyle = '#000000';
  g.fillStyle = `rgb(${[...rgb]})`;

  var col = g.fillStyle;

  return col;
}