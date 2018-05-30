'use strict';

var O = require('../framework');
var media = require('../media');
var {Canvas, registerFont} = require('./node_modules/canvas');

var w = 640;
var h = 480;

var [wh, hh] = [w, h].map(a => a >> 1);

media.renderImage('-img/1.png', w, h, (w, h, g) => {
  g.fillStyle = {toString: () => "#0000ff", valueOf: () => "#00ff00"};
  g.fillRect(0, 0, 300, 100);
});