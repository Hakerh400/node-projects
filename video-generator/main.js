'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var logStatus = require('../log-status');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 60;
var framesNum = fps * duration;

var radius = 64;

setTimeout(main);

function main(){
  var d;

  media.editImage('-dw/1.png', '-', (w, h, g0) => {
    var [wh, hh] = [w, h].map(a => a >> 1);
    var d0 = new ImageData(g0);

    media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
      logStatus(f, framesNum);

      if(f === 1){
        g.drawImage(g0.canvas, 0, 0);
        d = new ImageData(g);
      }else{
        var angle = (f - 1) / (fps * 10) * O.pi2;
        var sin = -Math.sin(angle);
        var cos = Math.cos(angle);

        var x1 = wh - radius;
        var y1 = hh - radius;
        var x2 = wh + radius;
        var y2 = hh + radius;

        for(var y = y1; y <= y2; y++){
          for(var x = x1; x <= x2; x++){
            var xx = x - wh;
            var yy = y - hh;

            if(Math.hypot(xx, yy) > radius)
              continue;

            var x0 = wh + Math.round(xx * cos - yy * sin);
            var y0 = hh + Math.round(xx * sin + yy * cos);
            var col = d0.get(x0, y0);

            d.set(x, y, ...col);
          }
        }
      }

      d.put();

      return f !== framesNum;
    });
  });
}