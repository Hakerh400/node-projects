'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 60 * 60;
const framesNum = fps * duration;

const exp1 = 2;
const exp2 = 10;
const radius = 64;
const layersNum = 20;
const entsPerLayer = 40;

const [wh, hh] = [w, h].map(a => a >> 1);

const outputFile = getOutputFile();

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

  function init(g){
    imgd = g.getImageData(0, 0, w, h);
    data = imgd.data;
  }

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    if(f === 1) init(g);

    layers.forEach(layer => {
      layer.ents.forEach((e, i) => {
        e.r = (Math.cos(i + f / (i + 10)) + 1) / 2 * radius;
      });
    });

    for(var y = 0, i = 0; (y | 0) !== (h | 0); y++){
      for(var x = 0; (x | 0) !== (w | 0); x++, i += 4){
        if(!x) media.logStatus((f - 1) * h + y, h * framesNum, 'chunk');

        red = green = blue = 0;

        for(var layerNum = 0; (layerNum | 0) !== (layersNum | 0); layerNum++){
          ents = layers[layerNum | 0].ents;
          sum1 = sum2 = 0;

          for(var j = 0; (j | 0) !== (entsPerLayer | 0); j++){
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
          for(var j = 0; j !== ents.length; j++){
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

    return f !== framesNum;
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

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}