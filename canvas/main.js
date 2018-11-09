'use strict';

const fs = require('fs');
const O = require('../framework');
const {Image, Canvas} = require('../canvas');

var img = new Image();
img.onload = () => log('ok');
img.onerror = err => { throw err; };
img.src = fs.readFileSync('1.bmp');

var ctx = new Canvas(img.width, img.height).getContext('2d');
ctx.drawImage(img, 0, 0);