'use strict';

const fs = require('fs');
const O = require('../framework');
const ffn = require('../format-file-name');
const {Image, Canvas} = require('../canvas');

var Context2d = require('./node_modules/canvas/build/Release/canvas.node').CanvasRenderingContext2d;
new (new Canvas(1, 1).getContext('2d').constructor)(Object.create(Canvas.prototype)).rect;
return;

var img = new Image();
img.onload = () => log(img.width, img.height);
img.onerror = err => { throw err; };
img.src = fs.readFileSync(ffn('-dw/1.png'));