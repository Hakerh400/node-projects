'use strict';

var O = require('../framework');
var media = require('../media');
var logStatus = require('../log-status');

var entsNum = 10e3;

setTimeout(main);

function main(){
  media.editImage('-dw/1.png', '-dw/2.png', (w, h, g) => {
    var [wh, hh] = [w, h].map(a => a >> 1);

    var imgd = g.getImageData(0, 0, w, h);
    var data = imgd.data;

    var ents = O.ca(entsNum, () => {
      var x = O.rand(w);
      var y = O.rand(h);
      var i = x + y * w << 2;
      var col = [data[i], data[i + 1], data[i + 2]];

      return new Entity(x, y, 1, col);
    });

    for(var y = 0, i = 0; y < h; y++){
      logStatus(y + 1, h, 'row');

      for(var x = 0; x < w; x++, i += 4){
        var min = Infinity;
        var ent = null;

        for(var j = 0; j < ents.length; j++){
          var dist = Math.hypot(x - ents[j].x, y - ents[j].y)

          if(dist < min){
            min = dist;
            ent = ents[j];
          }
        }

        data[i] = ent.col[0];
        data[i + 1] = ent.col[1];
        data[i + 2] = ent.col[2];
      }
    }

    g.putImageData(imgd, 0, 0);
  });
}

class Entity{
  constructor(x, y, strength, col){
    this.x = x;
    this.y = y;
    this.strength = strength;
    this.col = col;
  }
};