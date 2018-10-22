'use strict';

const O = require('../framework');

class Vector extends Float64Array{
  constructor(x, y, z){
    super(3);
    this.set_(x, y, z);
  }

  clone(){ return new Vector(this[0], this[1], this[2]); }
  dist_(x, y, z){ return Math.sqrt((x - this[0]) ** 2 + (y - this[1]) ** 2 + (z - this[2]) ** 2); }

  len(){ return this.dist_(0, 0, 0); }
  setLen(len){ return this.mul(len / this.len()); }
  norm(){ return this.setLen(1); }

  set_(x, y, z){ this[0] = x, this[1] = y, this[2] = z; return this; }
  add_(x, y, z){ this[0] += x, this[1] += y, this[2] += z; return this; }
  sub_(x, y, z){ this[0] -= x, this[1] -= y, this[2] -= z; return this; }

  mul(k){ this[0] *= k, this[1] *= k, this[2] *= k; return this; }
  div(k){ if(k){ this[0] /= k, this[1] /= k, this[2] /= k; } return this; }

  lt_(x, y, z){ return this[0] < x && this[1] < y && this[2] < z; }
  gt_(x, y, z){ return this[0] > x && this[1] > y && this[2] > z; }

  set(v){ return this.set_(v[0], v[1], v[2]); }
  dist(v){ return this.dist_(v[0], v[1], v[2]); }
  add(v){ return this.add_(v[0], v[1], v[2]); }
  sub(v){ return this.sub_(v[0], v[1], v[2]); }
  lt(v){ return this.lt_(v[0], v[1], v[2]); }
  gt(v){ return this.gt_(v[0], v[1], v[2]); }
};

module.exports = Vector;