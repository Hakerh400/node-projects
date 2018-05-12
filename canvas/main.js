'use strict';

var O = require('../framework');
var media = require('../media');
var {Canvas, registerFont} = require('./node_modules/canvas');

var w = 640;
var h = 480;

media.renderImage('-img/1.png', w, h, (w, h, g) => {
  g.fillStyle = 'white';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'black';

  g.textAlign = 'center';
  g.font = '72px arial';
  g.fillText('#'.repeat(5e4) + 'A'.repeat(1e5) + '#'.repeat(5e4), w / 2, h / 2);
});