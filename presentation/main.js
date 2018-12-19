'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Presentation = require('.');

var w = 1920;
var h = 1080;
var fps = 60;

var [wh, hh] = [w, h].map(a => a >> 1);

setTimeout(main);

function main(){
  var pr = new Presentation(w, h, fps);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    g1.font = '100px arial';

    for(var i = 0; i < 60 * 10; i++)
      await pr.caption(i, .5e3);
  });
}