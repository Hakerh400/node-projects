'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var media = require('../media');
var Presentation = require('../presentation');
var svg = require('.');

var scale = 2;
var space = 10;

var svgDir = O.dirs.dw;

setTimeout(main);

function main(){
  var wMax = 0;
  var hMax = 0;

  var ctxs = fs.readdirSync(svgDir).map(fileName => {
    var filePath = path.join(svgDir, fileName);
    var src = fs.readFileSync(filePath, 'utf8');
    var [w, h, code] = svg.svg2ctx(src);

    w *= scale;
    h *= scale;

    if(w > wMax) wMax = w;
    if(h > hMax) hMax = h;

    var g = media.createContext(w, h);
    g.clearRect(0, 0, w, h);
    g.globalCompositeOperation = 'xor';
    g.fillStyle = 'black';
    g.strokeStyle = 'rgba(0,0,0,0)';
    g.scale(scale, scale);

    var func = new Function('g', code);
    func(g);

    return g;
  });

  var w = (wMax + space) * (10 + .5) | 0;
  var h = (hMax + space) * (18 + .5) | 0;

  var pr = new Presentation(1920, 1080, 60);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    g1.fillStyle = 'white';
    g1.fillRect(0, 0, w, h);
    await pr.fade();
    await pr.wait(1e3);

    for(var g2 of iconGenerator()){
      g1.fillStyle = 'white';
      g1.fillRect(0, 0, w, h);
      g1.drawImage(g2.canvas, (w - g2.canvas.width) / 2, (h - g2.canvas.height) / 2);
      await pr.fade();
    }

    await pr.wait(5e3);
    await pr.fadeOut();
  });

  function *iconGenerator(){
    var g = media.createContext(w, h);

    g.fillStyle = 'white';
    g.fillRect(0, 0, w, h);

    outer: for(var y = 0, i = 0; 1; y++){
      for(var x = 0; x < 10; x++, i++){
        if(i === ctxs.length)
          break outer;

        var g1 = ctxs[i];
        g.drawImage(g1.canvas, x * (wMax + space) + (wMax - g1.canvas.width) / 2, y * (hMax + space) + (hMax - g1.canvas.height) / 2);

        yield g;
      }
    }
  }
}