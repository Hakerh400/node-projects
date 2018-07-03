'use strict';

var O = require('../framework');
var media = require('../media');
var {Canvas, loadImage, registerFont} = require('../canvas');

var w = 640;
var h = 480;

var [wh, hh] = [w, h].map(a => a >> 1);

media.renderImage('-img/1.png', w, h, (w, h, g) => {
  const s = 32;
  const sh = s / 2;
  const shh = s / 4;

  g.globalCompositeOperation = 'source-over';

  g.fillStyle = 'black';
  g.fillRect(0, 0, w, h);

  g.fillStyle = 'white';
  g.fillRect(shh, shh, sh, sh);

  g.globalCompositeOperation = 'darken';
  g.fillStyle = 'red';
  g.fillRect(0, 0, w, h);
});