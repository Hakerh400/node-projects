'use strict';

const O = require('../framework');

class Vector extends Float64Array{
  constructor(x, y, z){
    super(3);
    this.set_(x, y, z);
  }

  clone(){ return new Vector(this[0], this[1], this[2]); }
  dist_(x, y, z){ return Math.sqrt((this[0] - x) ** 2 + (this[1] - y) ** 2 + (this[2] - z) ** 2); }
  dists_(x, y, z){ return (this[0] - x) ** 2 + (this[1] - y) ** 2 + (this[2] - z) ** 2; }
  distm_(x, y, z){ return Math.abs(this[0] - x) + Math.abs(this[1] - y) + Math.abs(this[2] - z); }

  len(){ return this.dist_(0, 0, 0); }
  lens(){ return this.dists_(0, 0, 0); }
  lenm(){ return this.distm_(0, 0, 0); }

  setLen(len){ return this.mul(len / this.len()); }
  norm(){ return this.setLen(1); }

  set_(x, y, z){ this[0] = x, this[1] = y, this[2] = z; return this; }
  add_(x, y, z){ this[0] += x, this[1] += y, this[2] += z; return this; }
  sub_(x, y, z){ this[0] -= x, this[1] -= y, this[2] -= z; return this; }

  mul(k){ this[0] *= k, this[1] *= k, this[2] *= k; return this; }
  div(k){ if(k){ this[0] /= k, this[1] /= k, this[2] /= k; } return this; }

  rot_(rx, ry, rz){
    var x = this[0], y = this[1], z = this[2];

    var s = Math.sin(rx), c = Math.cos(rx);
    var x1 = x, y1 = y * c - z * s, z1 = y * s + z * c;

    s = Math.sin(ry), c = Math.cos(ry);
    var x2 = x1 * c + z1 * s, y2 = y1, z2 = z1 * c - x1 * s;

    s = Math.sin(rz), c = Math.cos(rz);
    return this.set_(x2 * c - y2 * s, x2 * s + y2 * c, z2);
  }

  rotn_(rx, ry, rz){ return this.rot_(-rx, -ry, -rz); }

  lt_(x, y, z){ return this[0] < x && this[1] < y && this[2] < z; }
  gt_(x, y, z){ return this[0] > x && this[1] > y && this[2] > z; }

  set(v){ return this.set_(v[0], v[1], v[2]); }
  dist(v){ return this.dist_(v[0], v[1], v[2]); }
  dists(v){ return this.dists_(v[0], v[1], v[2]); }
  distm(v){ return this.distm_(v[0], v[1], v[2]); }
  add(v){ return this.add_(v[0], v[1], v[2]); }
  sub(v){ return this.sub_(v[0], v[1], v[2]); }
  rot(v){ return this.rot_(v[0], v[1], v[2]); }
  rotn(v){ return this.rotn_(v[0], v[1], v[2]); }
  lt(v){ return this.lt_(v[0], v[1], v[2]); }
  gt(v){ return this.gt_(v[0], v[1], v[2]); }
};

module.exports = Vector;