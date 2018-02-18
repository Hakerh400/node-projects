'use strict';

var {Canvas} = require('../media/node_modules/canvas');
var media = require('../media');

var w = 128;
var h = 128;

var str = 'Test';
var offset = .9;

setTimeout(main);

function main(){
  var offset2 = offset * 2 - 1;

  media.renderImage('-dw/1.png', w, h, (w, h, g) => {
    var [wh, hh] = [w, h].map(a => a >> 1);
    var wOffset = w * offset2;

    g.fillStyke = 'white';
    g.fillRect(0, 0, w, h);

    g.textBaseline = 'middle';
    g.textAlign = 'center';

    setTextSize(g, calcTextSize(wOffset, str));

    g.fillStyle = 'black';
    g.fillText(str, wh, hh);
  });
}

function setTextSize(g, size){
  g.font = `${size}px arial`;
}

function calcTextSize(w, str){
  if(!calcTextSize.g){
    calcTextSize.g = new Canvas(1, 1).getContext('2d');
  }

  var g = calcTextSize.g;
  setTextSize(g, w);

  var s = g.measureText(str).width;
  var size = s ? w ** 2 / s : 0;

  return size;
}