'use strict';

var O = require('../framework');
var media = require('../media');
var conv = require('../color-converter');

const CIRCS_NUM = 1e3;

var w = 1920;
var h = 1080;
var fps = 60;
var fast = 0;

var duration = 60;
var framesNum = fps * duration;

var [wh, hh] = [w, h].map(a => a / 2);

var cols = {
  bg: conv.color('darkgray'),
  circ: conv.color('#00ff00'),
};

setTimeout(main);

function main(){
  var circs = O.ca(CIRCS_NUM, i => {
    var k = Math.random() ** 2;
    var len = k * wh;
    var angle = O.randf(O.pi2);

    var x = Math.cos(angle) * len;
    var y = Math.sin(angle) * len;

    var col = O.Color.from(O.hsv(k));

    return new Circle(x, y, 0, col);
  });

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    g.resetTransform();
    g.fillStyle = cols.bg;
    g.fillRect(0, 0, w, h);

    g.translate(wh, hh);
    var len = circs.length;

    if(f === 1){
      var dist = Infinity;
      var ii, jj;

      for(var i = 0; i < len; i++){
        var circ = circs[i];
        for(var j = i + 1; j < len; j++){
          var d = circ.dist(circs[j]);
          if(d < dist){
            dist = d;
            ii = i;
            jj = j;
          }
        }
      }

      var circ = circs[ii];
      var cc = [circ];

      circ.r = dist / 2;
      circ.ready = true;

      var circ = circs[jj];
      while(circ !== null){
        cc.push(circ);
        circ = circ.next(circs);
      }

      circs = cc;
    }else{
      for(var i = 0; i < len; i++){
        var circ = circs[i];
        var dist = Infinity;

        for(var j = 0; j < len; j++){
          var c = circs[j];
          if(c === circ) continue;

          var d = circ.dist(c);
          if(d < dist) dist = d;
        }

        if(i === 0) dist /= 2;

        circ.r = dist;
        circ.ready = true;
      }
    }

    for(var i = 0; i < len; i++){
      var circ = circs[i];
      circ.draw(g);
      circ.tick();
    }

    return f !== framesNum;
  });
}

class Circle extends O.Vector{
  constructor(x, y, r, col){
    super(x, y);

    this.r = r;
    this.col = col;

    this.ready = false;
  }

  dist(circ){
    return super.dist(circ) - this.r - circ.r;
  }

  next(circs){
    var len = circs.length;
    var dist1 = Infinity, dist2 = Infinity
    var ii;

    for(var i = 0; i < len; i++){
      var circ = circs[i];
      if(circ === this) continue;

      var d = this.dist(circ);

      if(circ.ready){
        if(d < dist1)
          dist1 = d;
      }else{
        if(d < dist2){
          dist2 = d;
          ii = i;
        }
      }
    }

    this.r = dist1;
    this.ready = true;

    if(dist2 === Infinity) return null;

    return circs[ii];
  }

  tick(){
    this.r = 0;
    this.ready = false;

    var angle = this.angle() + 1 / this.len();
    this.setAngle(angle);
  }

  draw(g){
    g.fillStyle = this.col;
    g.beginPath();
    g.arc(this.x, this.y, this.r, 0, O.pi2);
    g.fill();
    g.stroke();
  }
};