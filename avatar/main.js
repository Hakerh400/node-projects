'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var w = 400;
var h = 400;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var [wh, hh] = [w, h].map(a => a >> 1);

    g.clearRect(0, 0, w, h);

    var d = new ImageData(g);

    d.iterate((x, y) => {
      var dd = dist(x, y, wh, hh);
      if(dd > wh) return;

      var s = w * .03;

      var angle = Math.atan2(hh - y, x - wh);
      angle = (angle % O.pi2 + O.pi2) % O.pi2;

      var mod = (a, b) => a - Math.floor(a / b) * b;
      var angle2 = O.pih * 1.5;
      var diff = mod(angle2 - angle + O.pi, O.pi2) - O.pi;
      diff = Math.abs(diff) / O.pi;

      var c1 = [255, 255, 255];
      var c2 = [20, 20, 20];

      if(dd > wh - s){
        return [...interpolate(c1, c2, diff ** .5), 255];
      }else if(dd > wh - s * 2){
        return [...interpolate(c1, c2, (1 - diff) ** .5), 255];
      }else{
        var c1 = [255, 255, 255];
        var c2 = [0, 200, 0];

        var x1 = wh + Math.cos(angle2) * (wh - s);
        var y1 = hh + Math.sin(-angle2) * (hh - s);
        var k = dist(x, y, x1, y1) / w;

        return [...interpolate(c1, c2, k), 255];
      }

    }, true);

    d.put();

    g.textBaseline = 'middle';
    g.textAlign = 'center';

    var str = 'H400';
    var font = 'arial';

    g.font = `${w}px ${font}`;
    var fontSize = w ** 2 / g.measureText(str).width * .75;

    g.font = `${fontSize}px ${font}`;
    g.fillStyle = 'black';
    g.fillText(str, wh, hh);
  });
}

function dist(x1, y1, x2, y2){
  var dx = x2 - x1;
  var dy = y2 - y1;

  return Math.sqrt(dx * dx + dy * dy);
}

function interpolate(arr1, arr2, k){
  var k1 = 1 - k;

  return O.ca(arr1.length, i => {
    return Math.round(arr1[i] * k1 + arr2[i] * k);
  });
}