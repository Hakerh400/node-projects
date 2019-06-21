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
  const canvas = {
    getContext(){
      return {
        canvas,
        fillRect(){},
      };
    },
  };

  return canvas;
}