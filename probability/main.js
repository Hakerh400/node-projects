'use strict';

var O = require('../framework')
var media = require('../media')

var w = 640;
var h = 480;
var iterations = 10e6;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var [wh, hh] = [w, h].map(a => a >> 1);

    g = new O.EnhancedRenderingContext(g);

    g.fillStyle = 'lightgray';
    g.fillRect(0, 0, w, h);

    var cols = ['#ff0000', '#00ff00'];

    getProbabilities(iterations).forEach((prob, index) => {
      var y = (1 - prob / iterations) * h;
      var col = cols[index];

      g.fillStyle = col;
      g.beginPath();
      g.rect(wh * index, y, wh, h - y);
      g.fill();
      g.stroke();
    });
  });
}

function getProbabilities(iterations){
  var ps = O.ca(2, () => 0);

  O.repeat(iterations, () => {
    var index = !!getValue() | 0;
    ps[index]++;
  });

  return ps;
}

function getValue(){
  return O.ca(2, () => probFunc()).reduce((a, b) => a | b, 0);
}

function probFunc(){
  return Math.random() > 1 / Math.sqrt(2);
}