'use strict';

var O = require('../framework');
var media = require('../media');

const SIZE = 400;

module.exports = {
  convert,
};

async function convert(buff){
  return await new Promise((res, rej) => {
    media.buff2canvas(buff, (canvas, err) => {
      if(canvas === null){
        if(err instanceof Error)
          err = err.message;

        return rej(new Error(`Conversion failed: ${err}`));
      }

      var {width: w, height: h} = canvas;

      var g = media.createContext(SIZE, SIZE);
      g.clearRect(0, 0, SIZE, SIZE);

      var s = SIZE / Math.min(w, h);
      var [ws, hs] = [w, h].map(a => a * s);
      g.drawImage(canvas, 0, 0, w, h, (SIZE - ws) / 2, (SIZE - hs) / 2, ws, hs);

      res(g.canvas);
    });
  });
}