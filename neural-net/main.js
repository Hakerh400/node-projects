'use strict';

var O = require('../framework');
var media = require('../media');
var nn = require('.');

var w = 1920;
var h = 1080;
var fps = 60;
var duration = 60;
var framesNum = fps * duration;

setTimeout(main);

function main(){
  var model = nn.loadModel();

  var [ws, hs] = [w, h].map(a => a / 32);

  media.renderVideo('-vid/1.mp4', w, h, fps, true, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    var input = [(f - 1) / (framesNum - 1)];
    var output = model.feed(input);

    g.fillStyle = 'darkgray';
    g.fillRect(0, 0, w, h);
    g.globalAlpha = 1 - (1 - 1 / 9) ** 2;

    for(var y = 0; y < 32; y++){
      for(var x = 0; x < 32; x++){
        var i = (x + y * 32) * 3;

        var red = O.bound(Math.round(output[i] * 255), 0, 255);
        var green = O.bound(Math.round(output[i + 1] * 255), 0, 255);
        var blue = O.bound(Math.round(output[i + 2] * 255), 0, 255);

        g.fillStyle = O.rgb(red, green, blue);
        g.fillRect((x - 1) * ws, (y - 1) * hs, ws * 3, hs * 3);
      }
    }

    g.globalAlpha = 1;

    return f !== framesNum;
  });
}