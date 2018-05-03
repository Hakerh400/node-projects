'use strict';

var O = require('../framework');
var Presentation = require('../presentation');
var ImageData = require('../image-data');

var w = 1920;
var h = 1080;
var fps = 60;

var text = '冬季時高飛低';

setTimeout(main);

function main(){
  var pr = new Presentation(w, h, fps);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    var [wh, hh] = [w, h].map(a => a >> 1);

    g1.font = '72px DFKai-SB';
    g1.fillStyle = 'black';
    g1.fillRect(0, 0, w, h);
    g1.fillStyle = 'white';
    g1.fillText(text, wh, hh);

    var arr = O.ca(h, () => O.ca(w, () => 0));
    var d = new ImageData(g1);

    d.iterate((x, y, r, g, b) => {
      var k = (r + g + b) / (255 * 3);
      var v = (x / w + y / h) % 1;

      arr[y][x] = k;

      return O.hsv(v).map(a => Math.round(a * k));
    });

    d.put();
    await pr.fade();

    var len = fps * 60 * 10;
    var f = 0;

    d = new ImageData(g);

    for(var i = 0; i < len; i++){
      d.iterate((x, y) => {
        var k = arr[y][x];
        var v = ((x / w + y / h - f) % 1 + 1) % 1;

        return O.hsv(v).map(a => Math.round(a * k));
      });

      d.put();
      await pr.frame();

      f = (f + 5 / w) % 1;
    }

    await pr.fadeOut();
  });
}