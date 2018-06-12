'use strict';

var O = require('../framework');
var media = require('../media');

const ENTS_NUM = 10e6;
const OFFSET = 200;
const FACTOR = .01;

const BG_COLOR = new O.Color(0, 0, 0);

var w = 1920;
var h = 1080;
var fps = 60;
var fast = 0;

var [wh, hh] = [w, h].map(a => a / 2);

setTimeout(main);

function main(){
  var ents = createEnts(ENTS_NUM, OFFSET);

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(ENTS_NUM - ents.length + 1, ENTS_NUM, 'entity');

    if(f === 1){
      g.fillStyle = BG_COLOR;
      g.fillRect(0, 0, w, h);
    }

    ents.forEach(ent => ent.draw(g));
    ents = ents.filter(ent => ent.alive);
    ents.forEach(ent => ent.tick());

    return ents.length !== 0;
  });
}

function createEnts(num, offset){
  var x = offset;
  var y = hh;

  return O.ca(num, i => {
    var k = i / num;
    var angle = k * O.pi2;

    var vel = O.Vector.fromAngle(1, angle);
    var col = O.Color.from(O.hsv(k));

    return new Entity(x, y, vel, col);
  });
}

class Entity extends O.Vector{
  constructor(x, y, vel, col){
    super(x, y);

    this.prev = super.clone();
    this.vel = vel;
    this.col = col;

    this.alive = this.isAlive();
  }

  tick(){
    if(!this.alive) return;
    var {vel} = this;

    this.prev.set(this);
    this.add(vel);

    if(!this.isAlive()){
      this.alive = false;
      return;
    }

    var dx = -(1 - vel.x) * FACTOR;
    var dy = vel.y * FACTOR;
    vel.add(dx, dy).setLen(1);
  }

  draw(g){
    var {prev} = this;

    g.strokeStyle = this.col;
    g.beginPath();
    g.moveTo(prev.x, prev.y);
    g.lineTo(this.x, this.y);
    g.stroke();
  }

  isAlive(){
    if(this.x < 0) return false;
    if(this.vel.y === 0) return this.x < w;
    return true;
  }
};