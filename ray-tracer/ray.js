'use strict';

const O = require('../framework');
const Vector = require('./vector');

class Ray extends Vector{
  constructor(x, y, z, vx=0, vy=0, vz=0, len=null){
    super(x, y, z);

    this.vel = new Vector(vx, vy, vz);
    if(len !== null) this.vel.setLen(len);
  }

  move(){ return this.add(this.vel); }
};

module.exports = Ray;