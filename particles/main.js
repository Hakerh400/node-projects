'use strict';

var O = require('../framework');
var media = require('../media');

const HD = 1;
const SPEED = 500 | 0;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;
var duration = 60 * 10;
var framesNum = fps * duration;

setTimeout(main);

function main(){
  var n = w * h << 2;
  var d = Buffer.alloc(n);

  var [w1, h1] = [w, h].map(a => a - 1);

  var get = (x, y) => {
    if(x < 0 || y < 0 || x >= w || y >= h)
      return null;

    var i = (x | 0) + (y | 0) * (w | 0) << 2;

    return d[i | 0] | 0;
  };

  var set = (x, y, a) => {
    if(x < 0 || y < 0 || x >= w || y >= h)
      return null;

    var i = (x | 0) + (y | 0) * (w | 0) << 2;

    d[i | 0] = d[(i | 0) + 1 | 0] = d[(i | 0) + 2 | 0] = a | 0;
  };

  for(var i = 0; i < n; i += 4)
    d[i + 3] = 255;

  for(var y = 0; y < h; y++){
    for(var x = 0; x < w; x++){
      if(O.rand(20) === 0)
        set(x, y, 255);
    }
  }

  media.renderVideo('-vid/2.mp4', w, h, fps, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1)
      return d;

    if(f === framesNum){
      var imgd = g.createImageData(w, h);
      var data = imgd.data;

      for(var y = 0; y < h; y++){
        for(var x = 0; x < w; x++){
          var i = x + y * w << 2;
          if(get(x, y) === 255)
            data[i] = data[i + 1] = data[i + 2] = 255;
          data[i + 3] = 255;
        }
      }

      g.putImageData(imgd, 0, 0);

      return false;
    }

    for(var sp = 0; sp < SPEED; sp++){
      for(var i = 0; i < 500; i++){
        var x = O.rand(w);
        var y = O.rand(h);

        if(get(x, y) === 255)
          break;
      }

      if(i === 500)
        continue;

      var q1 = [x, y];
      var q2 = [];
      var dirs = 15;

      while(q1.length !== 0){
        var x = q1.shift();
        var y = q1.shift();
        var k;

        if(get(x, y) === 0)
          continue;

        q2.push(x, y);
        set(x, y, 0);

        if(y === 0) dirs &= ~1;
        if(x === 0) dirs &= ~2;
        if(y === h1) dirs &= ~4;
        if(x === w1) dirs &= ~8;

        if((k = get(x, y - 1)) !== null && k !== 0) q1.push(x, y - 1);
        if((k = get(x - 1, y)) !== null && k !== 0) q1.push(x - 1, y);
        if((k = get(x, y + 1)) !== null && k !== 0) q1.push(x, y + 1);
        if((k = get(x + 1, y)) !== null && k !== 0) q1.push(x + 1, y);
      }

      var dx, dy;

      if(dirs === 0){
        dx = dy = 0;
      }else{
        var ddir = O.rand((dirs & 1) + ((dirs >> 1) & 1) + ((dirs >> 2) & 1) + ((dirs >> 3) & 1));

        for(var dir = 0; dir < 4; dir++){
          if(dirs & 1)
            if(ddir-- === 0)
              break;
          dirs >>= 1;
        }

        dx = dir === 1 ? -1 : dir === 3 ? 1 : 0;
        dy = dir === 0 ? -1 : dir === 2 ? 1 : 0;
      }

      var qn = q2.length;

      for(var i = 0; i < qn; i += 2)
        set(q2[i] + dx, q2[i + 1] + dy, 1);
    }

    for(var y = 0; y < h; y++){
      for(var x = 0; x < w; x++){
        if(get(x, y) === 1)
          set(x, y, 255);
      }
    }

    return d;
  });
}