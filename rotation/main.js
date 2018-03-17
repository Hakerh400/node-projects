'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var logStatus = require('../log-status');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 10;
var framesNum = fps * duration;

setTimeout(main);

function main(){
  var circs = O.ca(1e3, () => {
    var x = Math.random() * w;
    var y = Math.random() * h;
    var radius = 16 + Math.random() * 128;
    var speed = Math.random() - .5;

    return new Circle(x, y, radius, speed);
  });

  var d;

  media.editImage('-dw/1.png', '-', (w, h, g0) => {
    var [wh, hh] = [w, h].map(a => a >> 1);
    var d0 = new ImageData(g0);

    media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
      logStatus(f, framesNum);

      if(f === 1){
        g.drawImage(g0.canvas, 0, 0);
        d = new ImageData(g);
      }else{
        circs.forEach(circ => {
          circ.draw(d0, d, f);
        });
      }

      d.put();

      return f !== framesNum;
    });
  });
}

class Circle{
  constructor(x, y, radius, speed){
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
  }

  draw(d0, d, f){
    var angle = (f - 1) / fps * this.speed * O.pi2;
    var sin = -Math.sin(angle);
    var cos = Math.cos(angle);

    var x1 = this.x - this.radius;
    var y1 = this.y - this.radius;
    var x2 = this.x + this.radius;
    var y2 = this.y + this.radius;

    for(var y = y1; y <= y2; y++){
      for(var x = x1; x <= x2; x++){
        var xx = x - this.x;
        var yy = y - this.y;

        if(Math.hypot(xx, yy) > this.radius)
          continue;

        var x0 = this.x + Math.round(xx * cos - yy * sin);
        var y0 = this.y + Math.round(xx * sin + yy * cos);
        var col = d0.get(x0, y0);

        d.set(x, y, ...col);
      }
    }
  }
};