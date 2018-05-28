'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

const DEBUG = 0;
const HD = 1;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;

var [wh, hh] = [w, h].map(a => a >> 1);
var [w1, h1] = [w, h].map(a => a - 1 | 0);
var [w2, h2] = [w, h].map(a => a - 1 << 1);

var grav = new O.Vector(0, .0005);
var fric = .9;
var velDec = .025;
var velMin = .0025;

setTimeout(main);

function main(){
  var nn = w * h;
  var n = nn;
  var nPrev = n;

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

      if(!DEBUG)
        return true;
    }

    if(DEBUG){
      col.fill(0);
      d.iterate(() => {
        return col;
      });

      var base = (h >> 2) * w;
      base = 0;

      for(var i = 0; i < n; i++){
        var ent = ents[base + i];

        d.set(ent.x | 0, ent.y | 0, O.hsv(i % w / w1, col));
        for(var sp = 0; sp < 10; sp++)
          ent.tick();
      }
    }else{
      do{
        for(var i = 0, j = 0; i < n; i++){
          var ent = ents[i];
          ent.tick();

          if(j !== 0)
            ents[i - j] = ent;

          if(ent.k !== null){
            j++;
            d.set(ent.xStart, ent.yStart, O.hsv(ent.k, col));
          }
        }

        if(j !== 0){
          n -= j;
          ents.length = n;
        }
      }while(n === nPrev);

      nPrev = n;
    }

    d.put();

    return n !== 0;
  });
}

var D = new ImageData((() => {
  var g = media.createContext(w, h);
  var a = require('fs').readFileSync(O.dirs.dw + '/1.hex');
  var imgd = g.getImageData(0, 0, w, h);
  var data = imgd.data;
  a.forEach((a, b) => -~b & 3 ? data[b] = a : 0);
  g.putImageData(imgd, 0, 0);
  return g;
})());
var C = Buffer.alloc(3);

class Entity extends O.Vector{
  constructor(x, y){
    super(x, y);

    this.xStart = x;
    this.yStart = y;

    var a = [...D.get(x, y, C)];
    var vel = new O.Vector(a[0] / 255 * O.pi, a[1] / 255 * O.pi);
    this.vel = vel;
    vel.setLen((a[0] + a[1] + a[2]) / (255 * 3));

    this.k = null;
  }

  tick(){
    var {vel} = this;

    this.add(vel);
    vel.add(grav);

    if(this.x < 0) this.x = -this.x, vel.dec(velDec, 0).mul(fric);
    else if(this.x > w1) this.x = w2 - this.x, vel.dec(velDec, 0).mul(fric);
    if(this.y < 0) this.y = -this.y, vel.dec(0, velDec).mul(fric);
    else if(this.y > h1) this.y = h2 - this.y, vel.dec(0, velDec).mul(fric);

    var len = vel.len();

    if(len < velMin){
      this.k = this.x / w1;
    }else if(len > 1){
      vel.setLen(1);
    }
  }
};