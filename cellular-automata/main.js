'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var logStatus = require('../log-status');

var w = 640;
var h = 480;
var fps = 60;
var hd = true;
var duration = 10;
var framesNum = fps * duration;

var [wh, hh] = [w, h].map(a => a >> 1);
var [w1, h1] = [w, h].map(a => a - 1);

setTimeout(main);

function main(){
  var d1, d2;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f === 1){
      d1 = new ImageData(g);

      d1.iterate((x, y) => {
        var r = O.rand(256);
        var g = O.rand(256);
        var b = O.rand(256);

        return [r, g, b];
      });

      d1.put();
      d2 = new ImageData(g);
    }else{
      var sum = O.ca(3, () => 0);

      d2.iterate((x, y) => {
        var col = d1.get(x, y);

        sum.fill(0);

        adjacent(d1, x, y, col => {
          for(var i = 0; i < 3; i++){
            sum[i] += col[i];
          }
        });

        for(var i = 0; i < 3; i++){
          sum[i] = Math.round(sum[i] / 255);

          if(col[i] >= 128){
            if(sum[i] !== 2 && sum[i] !== 3) col[i] -= O.rand(128);
          }else{
            if(sum[i] === 3) col[i] += O.rand(128);
          }
        }

        return col;
      });

      d2.put();

      [d1, d2] = [d2, d1];
    }

    return f !== framesNum;
  });
}

function adjacent(d, x, y, func){
  var bx1 = x !== 0;
  var by1 = y !== 0;
  var bx2 = x !== w1;
  var by2 = y !== h1;

  if(by1){
    if(bx1) func(d.get(x - 1, y - 1));
    if(bx2) func(d.get(x + 1, y - 1));
    func(d.get(x, y - 1));
  }

  if(bx1) func(d.get(x - 1, y));
  if(bx2) func(d.get(x + 1, y));

  if(by2){
    if(bx1) func(d.get(x - 1, y + 1));
    if(bx2) func(d.get(x + 1, y + 1));
    func(d.get(x, y + 1));
  }
}