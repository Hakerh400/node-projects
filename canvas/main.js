'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var media = require('../media');
var {Canvas, Image, registerFont} = require('./node_modules/canvas');

var w = 640;
var h = 480;

media.renderImage('-img/1.png', w, h, (w, h, g) => {
  var img = new Image();

  img.onload = () => {
    console.log('ok');
  };

  img.onerror = err => {
    console.log('Error occured');
    throw err;
  };

  img.src = fs.readFileSync('test.jpg');

  g.drawImage(img, 0, 0);
});