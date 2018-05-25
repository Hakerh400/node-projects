'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

const HD = 1;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;

var [wh, hh] = [w, h].map(a => a >> 1);
var [w1, h1] = [w, h].map(a => a - 1 | 0);
var [w2, h2] = [w, h].map(a => a - 1 << 1);

var grav = new O.Vector(0, .1);
var fric = .9;
var velDec = .5;
var velMin = .01;
var velMinH = velMin / 2;

setTimeout(main);

function main(){
  var nn = w * h;
  var n = nn;
  var col = Buffer.alloc(3);
  var d;

  var dist = (a, b, c, d) => Math.sqrt((a -= c) * a + (b -= d) * b);

  var ents = O.ca(n, i => {
    var x = i % w;
    var y = i / w | 0;

    return new Entity(x, y);
  });

  media.renderVideo('-vid/1.mp4', w, h, fps, (w, h, g, f) => {
    media.logStatus(nn - n + 1, nn, 'particle');

    if(f === 1){
      d = new ImageData(g);
      return true;
    }

    for(var i = 0; i < n; i++){
      var ent = ents[i];
      ent.tick();

      if(ent.k !== null){
        n--;
        ents.splice(i--, 1);
        d.set(ent.xStart, ent.yStart, O.hsv(ent.k, col));
      }
    }

    d.put();

    return n !== 0;
  });
}

class Entity extends O.Vector{
  constructor(x, y){
    super(x, y);

    this.xStart = x;
    this.yStart = y;

    this.vel = new O.Vector(y - x, x - y);
    this.vel.setLen(20);

    this.k = null;
  }

  tick(){
    var {vel} = this;

    this.add(vel);
    vel.add(grav);

    if(this.x < 0) this.x = 0, vel.dec(velDec, 0).mul(fric);
    else if(this.x > w1) this.x = w1, vel.dec(velDec, 0).mul(fric);
    if(this.y < 0) this.y = 0, vel.dec(0, velDec).mul(fric);
    else if(this.y > h1) this.y = h1, vel.dec(0, velDec).mul(fric);

    if(this.dist(wh, hh) < 50){
      var angle = vel.angle();
      vel.setAngle(angle + O.pih);
    }

    if(vel.len() < velMin)
      this.k = this.x / w;
  }
};