'use strict';

const O = require('../framework');
const media = require('../media');
const {Canvas, Image, loadImage} = require('.');

setTimeout(main);

function main(){
  var img = new Image();

  img.onload = () => {
    log('Loaded');
    render(img);
  };

  img.onerror = err => {
    log(err);
    process.exit(1);
  };

  img.src = 'C:/Users/Thomas/Downloads/1.jpg';
}

function render(img){
  media.renderImage('-img/1.png', img.width, img.height, (w, h, g) => {
    g.drawImage(img, 0, 0);
  });
}