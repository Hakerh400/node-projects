'use strict';

var O = require('../framework');
var media = require('../media');
var {Canvas, loadImage, registerFont} = require('../canvas');

var w = 640;
var h = 480;

var [wh, hh] = [w, h].map(a => a >> 1);

media.renderImage('-img/1.png', w, h, (w, h, g) => {
  return;
  var g1 = media.createContext(w, h);
  g.drawImage(g1.canvas, 1, 1, 1, 1, 0, 0, 0, 0);
  g.drawImage(g1.canvas, 0, 0, 0, 0, 1, 1, 1, 1);
  g.drawImage(g1.canvas, 0, 0, 0, 0, 0, 0, 0, 0);
  g.fillStyle = 'red';
  g.fillRect(0, 0, w, h);
});