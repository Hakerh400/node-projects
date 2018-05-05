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
      if(Math.abs(x - wh + Math.cos(x / 10 + Math.sin(y / 20) * 3) * 50) > (1 - (y - hh + Math.sin(y / 15 - Math.cos(x / 20) * 3) * 45) / hh) * wh - 2)
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

    for(i = 0; i < 102; i++){
      var angle = (f / (fps * 100) + i / 102) * O.pi2;
      var type = i % 3 + 2;

      setRect(wh + Math.cos(angle) * h * .25 - 5 | 0, hh + Math.sin(angle) * h * .25 - h * .25 | 0, 10, 10, type);
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
  g.moveTo(7, 1);
  g.bezierCurveTo(3.14, 1, 0, 4.14, 0, 8);
  g.bezierCurveTo(0, 11.86, 3.14, 15, 7, 15);
  g.bezierCurveTo(7.48, 15, 7.94, 14.95, 8.38, 14.86);
  g.bezierCurveTo(8.21, 14.78, 8.18, 14.13, 8.36, 13.77);
  g.bezierCurveTo(8.55, 13.36, 9.17, 12.32, 8.56, 11.97);
  g.bezierCurveTo(7.95, 11.62, 8.12, 11.47, 7.75, 11.06);
  g.bezierCurveTo(7.38, 10.65, 7.53, 10.59, 7.5, 10.48);
  g.bezierCurveTo(7.42, 10.14, 7.86, 9.59, 7.89, 9.54);
  g.bezierCurveTo(7.91, 9.48, 7.91, 9.27, 7.89, 9.21);
  g.bezierCurveTo(7.89, 9.13, 7.62, 8.99, 7.55, 8.98);
  g.bezierCurveTo(7.49, 8.98, 7.44, 9.09, 7.35, 9.11);
  g.bezierCurveTo(7.26, 9.13, 6.85, 8.86, 6.76, 8.78);
  g.bezierCurveTo(6.67, 8.7, 6.62, 8.55, 6.49, 8.44);
  g.bezierCurveTo(6.36, 8.31, 6.35, 8.41, 6.16, 8.33);
  g.bezierCurveTo(5.97, 8.25, 5.36, 8.02, 4.88, 7.85);
  g.bezierCurveTo(4.4, 7.66, 4.36, 7.38, 4.36, 7.19);
  g.bezierCurveTo(4.34, 6.99, 4.06, 6.72, 3.94, 6.52);
  g.bezierCurveTo(3.8, 6.32, 3.78, 6.05, 3.74, 6.11);
  g.bezierCurveTo(3.7, 6.17, 3.99, 6.89, 3.94, 6.92);
  g.bezierCurveTo(3.89, 6.94, 3.78, 6.72, 3.64, 6.54);
  g.bezierCurveTo(3.5, 6.35, 3.78, 6.45, 3.34, 5.59);
  g.bezierCurveTo(2.9, 4.73, 3.48, 4.29, 3.51, 3.84);
  g.bezierCurveTo(3.54, 3.39, 3.89, 4.01, 3.7, 3.71);
  g.bezierCurveTo(3.51, 3.41, 3.7, 2.82, 3.56, 2.6);
  g.bezierCurveTo(3.43, 2.38, 2.68, 2.85, 2.68, 2.85);
  g.bezierCurveTo(2.7, 2.63, 3.37, 2.27, 3.84, 1.93);
  g.bezierCurveTo(4.31, 1.59, 4.62, 1.87, 5, 1.98);
  g.bezierCurveTo(5.39, 2.11, 5.41, 2.07, 5.28, 1.93);
  g.bezierCurveTo(5.15, 1.8, 5.34, 1.76, 5.64, 1.8);
  g.bezierCurveTo(5.92, 1.85, 6.02, 2.21, 6.47, 2.16);
  g.bezierCurveTo(6.94, 2.13, 6.52, 2.25, 6.58, 2.38);
  g.bezierCurveTo(6.64, 2.51, 6.52, 2.49, 6.2, 2.68);
  g.bezierCurveTo(5.9, 2.88, 6.22, 2.9, 6.75, 3.29);
  g.bezierCurveTo(7.28, 3.68, 7.13, 3.04, 7.06, 2.74);
  g.bezierCurveTo(6.99, 2.44, 7.45, 2.68, 7.45, 2.68);
  g.bezierCurveTo(7.78, 2.9, 7.72, 2.7, 7.95, 2.76);
  g.bezierCurveTo(8.18, 2.82, 8.86, 3.4, 8.86, 3.4);
  g.bezierCurveTo(8.03, 3.84, 8.55, 3.88, 8.69, 3.99);
  g.bezierCurveTo(8.83, 4.1, 8.41, 4.29, 8.41, 4.29);
  g.bezierCurveTo(8.24, 4.12, 8.22, 4.31, 8.11, 4.37);
  g.bezierCurveTo(8, 4.43, 8.09, 4.59, 8.09, 4.59);
  g.bezierCurveTo(7.53, 4.68, 7.65, 5.28, 7.67, 5.42);
  g.bezierCurveTo(7.67, 5.56, 7.29, 5.78, 7.2, 6);
  g.bezierCurveTo(7.11, 6.2, 7.45, 6.64, 7.26, 6.66);
  g.bezierCurveTo(7.07, 6.69, 6.92, 6, 5.95, 6.25);
  g.bezierCurveTo(5.65, 6.33, 5.01, 6.66, 5.36, 7.33);
  g.bezierCurveTo(5.72, 8.02, 6.28, 7.14, 6.47, 7.24);
  g.bezierCurveTo(6.66, 7.34, 6.41, 7.77, 6.45, 7.79);
  g.bezierCurveTo(6.49, 7.81, 6.98, 7.81, 7.01, 8.4);
  g.bezierCurveTo(7.04, 8.99, 7.78, 8.93, 7.93, 8.95);
  g.bezierCurveTo(8.1, 8.95, 8.63, 8.51, 8.7, 8.5);
  g.bezierCurveTo(8.76, 8.47, 9.08, 8.22, 9.73, 8.59);
  g.bezierCurveTo(10.39, 8.95, 10.71, 8.9, 10.93, 9.06);
  g.bezierCurveTo(11.15, 9.22, 11.01, 9.53, 11.21, 9.64);
  g.bezierCurveTo(11.41, 9.75, 12.27, 9.61, 12.49, 9.95);
  g.bezierCurveTo(12.71, 10.29, 11.61, 12.04, 11.27, 12.23);
  g.bezierCurveTo(10.93, 12.42, 10.79, 12.87, 10.43, 13.15);
  g.bezierCurveTo(10.07, 13.43, 9.62, 13.79, 9.16, 14.06);
  g.bezierCurveTo(8.75, 14.29, 8.69, 14.72, 8.5, 14.86);
  g.bezierCurveTo(11.64, 14.16, 13.98, 11.36, 13.98, 8.02);
  g.bezierCurveTo(13.98, 4.16, 10.84, 1.02, 6.98, 1.02);
  g.lineTo(7, 1);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(8.64, 7.56);
  g.bezierCurveTo(8.55, 7.59, 8.36, 7.78, 7.86, 7.48);
  g.bezierCurveTo(7.38, 7.18, 7.05, 7.25, 7, 7.2);
  g.bezierCurveTo(7, 7.2, 6.95, 7.09, 7.17, 7.06);
  g.bezierCurveTo(7.61, 7.01, 8.15, 7.47, 8.28, 7.47);
  g.bezierCurveTo(8.41, 7.47, 8.47, 7.34, 8.69, 7.42);
  g.bezierCurveTo(8.91, 7.5, 8.74, 7.55, 8.64, 7.56);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(6.34, 1.7);
  g.bezierCurveTo(6.29, 1.67, 6.37, 1.62, 6.43, 1.56);
  g.bezierCurveTo(6.46, 1.53, 6.45, 1.45, 6.48, 1.42);
  g.bezierCurveTo(6.59, 1.31, 7.09, 1.17, 7, 1.45);
  g.bezierCurveTo(6.89, 1.72, 6.42, 1.75, 6.34, 1.7);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(7.57, 2.59);
  g.bezierCurveTo(7.38, 2.57, 6.99, 2.54, 7.05, 2.45);
  g.bezierCurveTo(7.35, 2.17, 6.96, 2.07, 6.71, 2.07);
  g.bezierCurveTo(6.46, 2.05, 6.37, 1.91, 6.49, 1.88);
  g.bezierCurveTo(6.61, 1.85, 7.1, 1.9, 7.19, 1.96);
  g.bezierCurveTo(7.27, 2.02, 7.71, 2.21, 7.74, 2.34);
  g.bezierCurveTo(7.76, 2.47, 7.74, 2.59, 7.57, 2.59);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(9.04, 2.54);
  g.bezierCurveTo(8.9, 2.63, 8.21, 2.13, 8.09, 2.02);
  g.bezierCurveTo(7.53, 1.54, 7.2, 1.71, 7.09, 1.61);
  g.bezierCurveTo(6.98, 1.51, 7.01, 1.42, 7.2, 1.27);
  g.bezierCurveTo(7.39, 1.12, 7.89, 1.33, 8.2, 1.36);
  g.bezierCurveTo(8.5, 1.39, 8.86, 1.63, 8.86, 1.91);
  g.bezierCurveTo(8.88, 2.16, 9.19, 2.41, 9.05, 2.54);
  g.lineTo(9.04, 2.54);
  g.closePath();
  g.fill();
  g.stroke();
}