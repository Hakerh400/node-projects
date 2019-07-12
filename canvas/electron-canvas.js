'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = {
  Canvas,
  createCanvas,
};

function Canvas(w, h){
  return createCanvas(w, h);
}

function createCanvas(w, h){
  const canvas = O.doc.createElement('canvas');

  canvas.width = w;
  canvas.height = h;

  return canvas;
}