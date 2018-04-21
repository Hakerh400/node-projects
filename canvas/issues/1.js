'use strict';

var media = require('../media');

var s = 2e4;

media.renderImage('-dw/1.png', s, s, (w, h, g) => {
  g.clearRect(0, 0, w, h);
});