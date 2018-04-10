'use strict';

var {Canvas, Image} = require('canvas');

process.stdin.on('data', () => {
  var loadImageNTimes = n => {
    if(n !== 0){
      var image = new Image();
      image.onload = () => {
        setTimeout(() => {
          // image.src = '';
          loadImageNTimes(n);
        });
      };
      image.src = '1.jpg';
    }
  };
  loadImageNTimes(500);
});