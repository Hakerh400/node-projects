'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 60 * 10;
var framesNum = fps * duration;

const ZOOM_FACTOR = 1.01;
const COL_FACTOR = 25;

setTimeout(main);

function main(){
  var [wh, hh] = [w, h].map(a => a / 2);
  var [ws, hs] = [w, h].map(a => a * ZOOM_FACTOR);
  var [wsh, hsh] = [ws, hs].map(a => a / 2);
  var [dw, dh] = [ws, hs].map((a, b) => a - [w, h][b]);
  var [dwh, dhh] = [dw, dh].map(a => a / 2);

  var g1 = media.createContext(w, h);
  var g2 = media.createContext(ws, hs);
  var fac = 2;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      var d = new ImageData(g);

      d.iterate((x, y) => {
        return O.ca(3, () => O.rand(256));
      });

      d.put();
    }

    fac *= ZOOM_FACTOR;

    if(fac > 2){
      fac /= 2;

      g1.drawImage(g.canvas, 0, 0, w, h, 0, 0, w, h);
      g2.drawImage(g.canvas, 0, 0, w, h, 0, 0, ws, hs);

      var imgd = g2.getImageData(0, 0, ws, hs);
      var data = imgd.data;

      for(var y = 0, i = 0; y < hs; y++){
        for(var x = 0; x < ws; x++, i += 4){
          data[i + 0] += O.rand(COL_FACTOR * 2 + 1) - COL_FACTOR;
          data[i + 1] += O.rand(COL_FACTOR * 2 + 1) - COL_FACTOR;
          data[i + 2] += O.rand(COL_FACTOR * 2 + 1) - COL_FACTOR;
        }
      }

      g2.putImageData(imgd, 0, 0);
    }

    var w1 = w * fac;
    var h1 = h * fac;
    var x1 = (w - w1) / 2;
    var y1 = (h - h1) / 2;

    g.drawImage(g1.canvas, 0, 0, w, h, x1, y1, w1, h1);
    g.globalAlpha = fac - 1;
    g.drawImage(g2.canvas, 0, 0, ws, hs, x1, y1, w1, h1);
    g.globalAlpha = 1;

    return f !== framesNum;
  });
}