'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var PseudoRandomGenerator = require('../pseudo-random-generator');
var logStatus = require('../log-status');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 60;
var framesNum = duration * fps;

var mainSeed = 'ABC123';
var bgCol = [0, 0, 0];

var [wh, hh] = [null, null];
var [w1, h1] = [null, null];

var gen = null;
var d = null;

setTimeout(main);

function main(){
  gen = new PseudoRandomGenerator(mainSeed);

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);
    gen.setSeed('');

    if(f == 1){
      [wh, hh] = [w, h].map(a => a >> 1);
      [w1, h1] = [w, h].map(a => a + 1);
      d = new ImageData(g);
    }

    d.iterate(() => bgCol);

    var shapes = O.ca(f, () => new Shape(gen.rand(w), gen.rand(h), randCol()));

    while(shapes.length){
      var index = O.rand(shapes.length);
      var shape = shapes[index];

      if(!shape.tick()){
        shapes.splice(index, 1);
      }
    }

    d.put();

    return f != framesNum;
  });
}

class Shape{
  constructor(x, y, col){
    this.col = col;
    this.queue = [new O.Point(x, y)];
  }

  tick(){
    if(this.isFinished()) return false;

    var index = O.rand(this.queue.length);
    var {x, y} = this.queue.splice(index, 1)[0];

    if(compareCols(d.get(x, y), bgCol)){
      d.set(x, y, ...this.col);

      this.tryToPush(x - 1, y);
      this.tryToPush(x + 1, y);
      this.tryToPush(x, y - 1);
      this.tryToPush(x, y + 1);
    }

    return !this.isFinished();
  }

  tryToPush(x, y){
    if(x < 0 || y < 0 || x >= w || y >= h) return;

    if(!compareCols(d.get(x, y), bgCol)) return;
    if(this.queue.find(p => p.x == x && p.y == y)) return;

    this.queue.push(new O.Point(x, y));
  }

  isFinished(){
    return !this.queue.length;
  }
};

function compareCols(col1, col2){
  return col1[0] == col2[0] && col1[1] == col2[1] && col1[2] == col2[2];
}

function randCol(){
  return O.ca(3, () => gen.rand(256));
}