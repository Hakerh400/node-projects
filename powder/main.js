'use strict';

var O = require('../framework');
var media = require('../media');

const HD = 1;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;
var duration = 60 * 60;
var framesNum = fps * duration;

setTimeout(main);

function main(){
  var cols = new Uint8Array([
    0,   0,   0,   255,
    128, 128, 128, 255,
    255, 0,   0,   255,
    255, 255, 0,   255,
    0,   255, 0,   255,
  ]);

  var [wh, hh] = [w, h].map(a => a >> 1);
  var [w1, h1] = [w, h].map(a => a - 1 | 0);

  var cx = wh | 0;
  var cy = hh - h * .25 + 5 | 0;

  var n = w * h;
  var nn = w * h << 2;

  var d = Buffer.alloc(nn);
  var p = new Int32Array(n);

  var get = (x, y) => {
    if((x | 0) < 0 || (y | 0) < 0 || (x | 0) >= (w | 0) || (y | 0) >= (h | 0))
      return null;

    return p[(x | 0) + (y | 0) * (w | 0) | 0] | 0;
  };

  var set = (x, y, a) => {
    if((x | 0) < 0 || (y | 0) < 0 || (x | 0) >= (w | 0) || (y | 0) >= (h | 0))
      return;

    p[x = (x | 0) + (y | 0) * (w | 0) | 0] = a | 0;
    d[x <<= 2] = cols[a = ((a < 0 ? -a : a) << 2) + 2 | 0] | 0;
    d[(x | 0) + 1 | 0] = cols[(a | 0) - 1 | 0] | 0;
    d[(x | 0) + 2 | 0] = cols[(a | 0) - 2 | 0] | 0;
  };

  var setRect = (x1, y1, w, h, a) => {
    w = x1 + w | 0;
    h = y1 + h | 0;

    for(var y = y1; y < h; y++)
      for(var x = x1; x < w; x++)
        set(x, y, a);
  };

  var update = () => {
    for(var i = 0; i < n; i++){
      if((p[i | 0] | 0) < 0)
        p[i | 0] = -p[i | 0] | 0;
    }
  };

  for(var i = 3; i < d.length; i += 4)
    d[i] = 255;

  var gs = 10;
  var gsh = gs >> 1;
  var [gw, gh] = [14, 16];
  var [gwh, ghh] = [gw, gh].map(a => a >> 1);
  var [gws, ghs] = [gw, gh].map(a => a * gs);
  var [gwsh, ghsh] = [gws, ghs].map(a => a >> 1);
  var g1 = media.createContext(gws, ghs);
  g1.clearRect(0, 0, gws, ghs);
  g1.fillStyle = 'white';
  g1.strokeStyle = 'rgba(0, 0, 0, 0)';
  g1.globalCompositeOperation = 'xor';
  g1.scale(gs, gs);
  icon(g1);
  var data = g1.getImageData(0, 0, gws, ghs).data;

  for(var y = 0; y < ghs; y++){
    for(var x = 0; x < gws; x++){
      var i = x + y * gws << 2;
      if(data[i] >= 128)
        set(cx - gwsh + x, cy - ghsh + y, 1);
    }
  }  

  for(var y = 0; y < h; y++){
    for(var x = 0; x < w; x++){
      if(Math.abs(x - wh + Math.cos(x / 10 + Math.sin(y / 17) * 3.2) * 50) > (1 - (y - hh + Math.sin(y / 15 - Math.cos(x / 22) * 2.7) * 45) / hh) * wh - 2)
        set(x, y, 1);
    }
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f > framesNum){
      var imgd = g.createImageData(w, h);
      var data = imgd.data;

      for(var i = 0; i < nn; i += 4){
        data[i] = d[i + 2];
        data[i + 1] = d[i + 1];
        data[i + 2] = d[i];
        data[i + 3] = 255;
      }

      g.putImageData(imgd, 0, 0);

      return false;
    }

    for(i = 0; i < 9; i++){
      var angle = (f / (fps * 100) + i / 9) * O.pi2;
      var type = i % 3 + 2;

      setRect(wh + Math.cos(angle) * (wh - 10) - 5 | 0, hh + Math.sin(angle) * h * .25 - h * .25 | 0, 10, 10, type);
    }

    if(f === 1)
      return d;

    var x1, x2, dx;

    if(O.rand(2) === 1){
      x1 = 0;
      x2 = w1
      dx = 1;
    }else{
      x1 = w1;
      x2 = 0;
      dx = -1;
    }

    for(var y = 0; y < h; y++){
      for(var x = x1; x !== x2; x += dx){
        var p = get(x, y);
        if(p <= 0 || p === 1) continue;
        p = -p;

        if(get(x, y + 1) === 0){
          if(O.rand(2) === 0){
            set(x, y, 0);
            set(x, y + 1, p);
            continue;
          }
        }else{
          if(O.rand(2) === 0)
            continue;
        }

        var p1 = get(x - 1, y) === 0;
        var p2 = get(x + 1, y) === 0;

        if(p1 && p2){
          var dir = O.rand(2);
          set(x, y, 0);
          set(dir === 0 ? x - 1 : x + 1, y, p);
        }else if(p1){
          set(x, y, 0);
          set(x - 1, y, p);
        }else if(p2){
          set(x, y, 0);
          set(x + 1, y, p);
        }
      }
    }

    update();

    return d;
  });
}

function icon(g){
  g.beginPath();
  g.moveTo(12.83, 2.17);
  g.bezierCurveTo(12.08, 1.42, 11.14, 1.03, 10, 1);
  g.bezierCurveTo(8.87, 1.03, 7.92, 1.42, 7.17, 2.17);
  g.bezierCurveTo(6.42, 2.92, 6.04, 3.86, 6.01, 5);
  g.bezierCurveTo(6.01, 5.3, 6.04, 5.59, 6.1, 5.89);
  g.lineTo(0, 12);
  g.lineTo(0, 13);
  g.lineTo(1, 14);
  g.lineTo(3, 14);
  g.lineTo(4, 13);
  g.lineTo(4, 12);
  g.lineTo(5, 12);
  g.lineTo(5, 11);
  g.lineTo(6, 11);
  g.lineTo(6, 10);
  g.lineTo(8, 10);
  g.lineTo(9.09, 8.89);
  g.bezierCurveTo(9.39, 8.97, 9.68, 9, 10, 9);
  g.bezierCurveTo(11.14, 8.97, 12.08, 8.58, 12.83, 7.83);
  g.bezierCurveTo(13.58, 7.08, 13.97, 6.14, 14, 5);
  g.bezierCurveTo(13.97, 3.86, 13.58, 2.92, 12.83, 2.17);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(11, 5.38);
  g.bezierCurveTo(10.23, 5.38, 9.62, 4.77, 9.62, 4);
  g.bezierCurveTo(9.62, 3.23, 10.23, 2.62, 11, 2.62);
  g.bezierCurveTo(11.77, 2.62, 12.38, 3.23, 12.38, 4);
  g.bezierCurveTo(12.38, 4.77, 11.77, 5.38, 11, 5.38);
  g.closePath();
  g.fill();
  g.stroke();
}