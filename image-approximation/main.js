'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var w = 640;
var h = 480;
var fps = 60;
var duration = 10;
var framesNum = fps * duration;

var batchSize = 100;

setTimeout(main);

function main(){
  var g1 = media.createContext(w, h);
  g1.fillStyle = 'red';
  g1.fillRect(100, 100, 100, 100);

  var data1 = g1.getImageData(0, 0, w, h).data;
  var diff = null;

  media.renderVideo('-vid/1.mp4', w, h, fps, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      var d = new ImageData(g);
      d.iterate(() => O.ca(3, () => O.rand(256)));
      d.put();

      diff = calcDiff(g.getImageData(0, 0, w, h).data, data1);
    }

    var imgd = g.getImageData(0, 0, w, h);
    var data = imgd.data;

    for(var i = 0; i < batchSize; i++)
      tick(g);

    var diffNew = calcDiff(g.getImageData(0, 0, w, h).data, data1);

    if(diffNew > diff){
      g.putImageData(imgd, 0, 0);
      return null;
    }

    diff = diffNew;

    return f !== framesNum;
  });
}

function tick(g){
  g.fillStyle = O.rgb(O.rand(256), O.rand(256), O.rand(256));
  g.fillRect(O.rand(w), O.rand(h), 1, 1);
}

function calcDiff(data1, data2){
  var len = data1.length;
  var diff = 0;

  for(var i = 0; i < len; i += 4)
    diff += Math.abs(data1[i] - data2[i]) +
            Math.abs(data1[i + 1] - data2[i + 1]) +
            Math.abs(data1[i + 2] - data2[i + 2]);

  return diff;
}