'use strict';

var O = require('../framework');
var media = require('../media');
var scs = require('.');

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const duration = 60;
const framesNum = fps * duration;

const [wh, hh] = [w, h].map(a => a >> 1);

setTimeout(main);

async function main(){
  var imgd, data;

  function init(g){
    imgd = g.createImageData(w, h);
    data = imgd.data;
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f);

    if(f === 1)
      init(g);

    var img = scs.take(0, 0, w, h);
    for(var i = 0; i !== img.length; i++) data[i] = img[i];

    g.putImageData(imgd, 0, 0);

    return f;
  });
}