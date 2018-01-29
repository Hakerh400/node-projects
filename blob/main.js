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

var exp1 = 2;
var exp2 = 10;
var radius = 64;
var layersNum = 20;
var entsPerLayer = 40;

var [wh, hh] = [w, h].map(a => a >> 1);
var layers = null;

setTimeout(main);

function main(){
  layers = createLayers(layersNum, entsPerLayer);

  var imgd;
  var data;

  var sum1, sum2;
  var ents;

  var dists = O.ca(entsPerLayer, () => 0);
  var red, green, blue;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    if(f == 1){
      imgd = g.getImageData(0, 0, w, h);
      data = imgd.data;
    }

    layers.forEach(layer => {
      layer.ents.forEach((e, i) => {
        e.r = (Math.cos(i + f / (i + 10)) + 1) / 2 * radius;
      });
    });

    for(var y = 0, i = 0; (y | 0) < (h | 0); y++){
      for(var x = 0; (x | 0) < (w | 0); x++, i += 4){
        if(!x) logStatus((f - 1) * h + y, h * framesNum, 'chunk');

        red = green = blue = 0;

        for(var layerNum = 0; (layerNum | 0) < (layersNum | 0); layerNum++){
          ents = layers[layerNum | 0].ents;
          sum1 = sum2 = 0;

          for(var j = 0; (j | 0) < (entsPerLayer | 0); j++){
            var e = ents[j | 0];
            var dist;

            if((x | 0) === (e.x | 0) && (y | 0) === (e.y | 0)){
              dist = e.r;
            }else{
              var dx = x - e.x;
              var dy = y - e.y;
              dist = e.r / Math.sqrt(dx * dx + dy * dy);
            }

            sum1 += dist ** exp1;
            sum2 += dist ** exp2;

            dists[j | 0] = dist;
          }

          if(sum1 > 1) break;
        }

        if(sum1 > 1){
          for(var j = 0; j < ents.length; j++){
            var e = ents[j];
            var dist = dists[j] ** exp2 / sum2;

            red += e.col[0] * dist;
            green += e.col[1] * dist;
            blue += e.col[2] * dist;
          }
        }else{
          red = (Math.sin(f / fps) + 1) / 2 * 255;
          green = (Math.sin(f / fps / Math.E) + 1) / 2 * 255;
          blue = (Math.sin(f / fps / Math.PI) + 1) / 2 * 255;
        }

        data[i | 0] = red;
        data[(i | 0) + 1 | 0] = green;
        data[(i | 0) + 2 | 0] = blue;
      }
    }

    g.putImageData(imgd, 0, 0);

    return f != framesNum;
  });
}

function createLayers(layersNum, entsPerLayer){
  return O.ca(layersNum, () => {
    return new Layer(entsPerLayer);
  });
}

function createEnts(entsNum){
  return O.ca(entsNum, () => {
    return new Entity(O.rand(w), O.rand(h), radius, randCol());
  });
}

class Layer{
  constructor(entsNum){
    this.ents = createEnts(entsNum);
  }
};

class Entity{
  constructor(x, y, r, col){
    this.x = x;
    this.y = y;
    this.r = r;
    this.col = col;
  }
};

function randCol(){
  return O.ca(3, () => O.rand(256));
}