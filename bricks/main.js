'use strict';

var O = require('../framework');
var media = require('../media');
var Presentation = require('../presentation');
var formatFileName = require('../format-file-name');

const ASPECT_RATIO = 4;
const SIZE_H = 20;
const RADIUS = 405;
const FADE = 2e3;

const SIZE_W = SIZE_H * ASPECT_RATIO;
const [SIZE_WH, SIZE_HH] = [SIZE_W, SIZE_H].map(a => a / 2);

const IMAGE = formatFileName('-dw/1.png');

var w = 1920;
var h = 1080;
var fps = 60;
var fast = 0;

var [wh, hh] = [w, h].map(a => a / 2);

var cols = {
  bg: new O.Color(255, 255, 255),
  line: new O.Color(0, 0, 0),
  brick: new O.Color(197, 90, 54),
  circ: new O.Color(255, 255, 0),
};

setTimeout(main);

function main(){
  var img;

  media.editImage(IMAGE, '-', (w, h, g) => {
    img = g.canvas;
  }, () => {
    render(img);
  });
}

function render(img){
  var pr = new Presentation(w, h, fps, fast);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    var proto = g.constructor.prototype;

    [
      ['moveTo', 2],
      ['lineTo', 2],
      ['rect', 4],
    ].forEach(([methodName, argsNum]) => {
      var method = proto[methodName];
      proto[methodName] = argsNum === 2 ? function(a, b){method.call(this, a + .5, b + .5)}
      : function(a, b, c, d){method.call(this, a + .5, b + .5, c, d)};
    });

    clear(g1);
    await pr.fade(FADE);

    g1.drawImage(g.canvas, 0, 0);
    var canvas = g1.canvas;

    var p = 250;
    var nn = 100;
    var n;

    var s = 100;
    var brick = new Brick(wh, hh, s, cols.brick);
    var x, y;

    n = nn;
    x = brick.left, y = brick.top;
    for(var i = 0, k = 1 / n; i < n; k = (++i + 1) / n){
      if(i !== 0) g.drawImage(canvas, 0, 0);

      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + k * brick.h, y);
      g.stroke();

      await pr.frame();
    }
    await pr.wait(p);
    g1.drawImage(g.canvas, 0, 0);

    for(var i = 0, k = 1 / n; i < n; k = (++i + 1) / n){
      if(i !== 0) g.drawImage(canvas, 0, 0);
      
      var angle = k * O.pih;

      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + brick.h * Math.cos(angle), y + brick.h * Math.sin(angle));
      g.stroke();

      await pr.frame();
    }
    await pr.wait(p);
    g1.drawImage(g.canvas, 0, 0);

    n = nn * 2;
    x += brick.h;
    for(var i = 0, k = 1 / n; i < n; k = (++i + 1) / n){
      if(i !== 0) g.drawImage(canvas, 0, 0);
      
      var angle = k * O.pi - O.pi;

      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + brick.h * Math.cos(angle), y + brick.h * Math.sin(angle));
      g.stroke();

      await pr.frame();
    }
    await pr.wait(p);
    g1.drawImage(g.canvas, 0, 0);

    x += brick.h;
    for(var i = 0, k = 1 / n; i < n; k = (++i + 1) / n){
      if(i !== 0) g.drawImage(canvas, 0, 0);
      
      var angle = O.pi - k * O.pi;

      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + brick.wh * Math.cos(angle), y + brick.wh * Math.sin(angle));
      g.stroke();

      await pr.frame();
    }
    await pr.wait(p);
    g1.drawImage(g.canvas, 0, 0);

    for(var i = 0, k = 1 / n; i < n; k = (++i + 1) / n){
      if(i !== 0) g.drawImage(canvas, 0, 0);

      var x1 = brick.left + k * brick.w;
      
      g.beginPath();
      g.moveTo(x1, y);
      g.lineTo(x1, y + brick.h);
      g.stroke();

      await pr.frame();
    }
    await pr.wait(p);
    g1.drawImage(g.canvas, 0, 0);

    n = nn;
    x = brick.left;
    for(var i = 0, k = 1 / n; i < n; k = (++i + 1) / n){
      if(i !== 0) g.drawImage(canvas, 0, 0);

      var y1 = brick.top + k * brick.h;
      
      g.beginPath();
      g.moveTo(x, y1);
      g.lineTo(x + brick.w, y1);
      g.stroke();

      await pr.frame();
    }
    await pr.wait(p);

    clear(g1);
    brick.draw(g1);
    await pr.fade(FADE);
    await pr.wait(p);

    n = nn * 2;
    for(var i = 0, k = 1 / n; i < n; k = (++i + 1) / n){
      clear(g);

      var k1 = 1 - k;

      brick.x = k1 * wh + k * SIZE_WH;
      brick.y = k1 * hh + k * SIZE_HH;
      brick.h = k1 * s + k * SIZE_H;
      brick.w = brick.h * ASPECT_RATIO;

      brick.update();
      brick.draw(g);

      await pr.frame();
    }
    await pr.wait(p);
    g1.drawImage(g.canvas, 0, 0);

    var bricks = [];
    var odd = 0;
    for(var y1 = SIZE_HH; y1 - SIZE_HH < h; y1 += SIZE_H){
      for(var x1 = !odd ? SIZE_WH : 0; x1 - SIZE_WH < w; x1 += SIZE_W){
        var k = -(x1 + y1) / (w + h);
        var brick = new Brick(x1, y1, SIZE_H, cols.brick.clone(), k);
        bricks.push(brick);
      }
      odd ^= 1;
    }
    bricks[0].k = 1;

    while(bricks[bricks.length - 1].k !== 1){
      clear(g);
      
      bricks.forEach(brick => {
        brick.k += .005;
        if(brick.k > 1) brick.k = 1;
        brick.draw(g);
      });

      await pr.frame();
    }
    await pr.wait(p);
    g1.drawImage(g.canvas, 0, 0);

    n = nn * 8;
    for(var i = 0, k = 1 / n; i < n; k = (++i + 1) / n){
      if(i !== 0) g.drawImage(canvas, 0, 0);
      
      var angle = k * O.pi2 - O.pih;
      circ(g, -O.pih, angle);

      await pr.frame();
    }
    await pr.wait(1e3);

    g1.drawImage(img, 0, 0);
    bricks.forEach(brick => {
      var found = false;

      for(var y = brick.top; y < brick.bottom; y++){
        for(var x = brick.left; x < brick.right; x++){
          if(dist(x, y, wh, hh) < RADIUS){
            found = true;
            break;
          }
        }
      }

      if(found)
        brick.k = 0;
    });
    bricks.forEach(brick => {
      brick.draw(g1);
    });
    await pr.fade(FADE);
    await pr.wait(10e3);

    g1.fillStyle = 'black';
    g1.fillRect(0, 0, w, h);
    await pr.fade(FADE);
  });
}

class Rectangle extends O.Vector{
  constructor(x, y, w, h, col, k=1){
    super(x, y);

    this.w = w;
    this.h = h;
    this.col = col;
    this.k = k;

    this.update();
  }

  update(){
    var {x, y, w, h} = this;

    var wh = this.wh = w / 2;
    var hh = this.hh = h / 2;

    this.left = x - wh;
    this.top = y - hh;
    this.right = x + wh;
    this.bottom = y + hh;
  }

  draw(g){
    var k = O.bound(this.k, 0, 1);

    if(k !== 1){
      var alpha = g.globalAlpha;
      g.globalAlpha *= k;
    }

    g.fillStyle = this.col;
    g.beginPath();
    g.rect(this.left, this.top, this.w, this.h);
    g.stroke();
    g.fill();

    if(k !== 1)
      g.globalAlpha = alpha;
  }
};

class Brick extends Rectangle{
  constructor(x, y, s, col, k=1){
    super(x, y, s * ASPECT_RATIO, s, col, k);
  }
};

function dist(x1, y1, x2, y2){
  var dx = x1 - x2;
  var dy = y1 - y2;

  return Math.sqrt(dx * dx + dy * dy);
}

function circ(g, a1, a2){
  g.lineWidth = 5;
  g.strokeStyle = cols.circ;
  g.beginPath();
  g.arc(wh, hh, RADIUS, a1, a2);
  g.stroke();
  g.strokeStyle = cols.line;
  g.lineWidth = 1;
}

function clear(g){
  g.fillStyle = cols.bg;
  g.fillRect(0, 0, w, h);
}