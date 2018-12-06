'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

class HopfieldMemory{
  constructor(vecs){
    vecs = transpose(vecs).map(vec => {
      return uni2bi(vec);
    });

    var len = vecs.length;
    var weights = new TriangularMatrix;

    for(var j = 0; j !== len; j++)
      for(var i = j + 1; i !== len; i++)
        weights.set(i, j, dotProd(vecs[i], vecs[j]));

    this.len = len;
    this.weights = weights;
  }

  match(vec){
    const {len, weights} = this;
    if(vec.length !== len) throw new TypeError('Invalid length');

    var x = uni2bi(vec);
    var y = copy(x);

    var indices = O.shuffle(O.ca(len, i => i));

    do{
      var upd = 0;

      indices.forEach(i => {
        var val = x[i];

        for(var j = 0; j !== len; j++)
          val += weights.get(i, j) * y[j];

        val = sgn(val);
        if(val === y[i]) return;

        upd = 1;
        y[i] = val;
      });
    }while(upd);

    return bi2uni(y);
  }
};

module.exports = HopfieldMemory;

function transpose(mat){
  var w = mat[0].length;
  var h = mat.length;

  return O.ca(w, x => {
    return O.ca(h, y => mat[y][x]);
  });
}

function dotProd(v1, v2){
  return v1.reduce((sum, val, index) => {
    return sum + val * v2[index];
  }, 0);
}

function uni2bi(vec){
  return vec.map(val => val === 1 ? 1 : -1);
}

function bi2uni(vec){
  return vec.map(val => val === 1 ? 1 : 0);
}

function copy(vec){
  return vec.slice();
}

function sgn(val){
  if(val >= 0) return 1;
  return -1;
}

class TriangularMatrix extends O.Map2D{
  get(x, y){
    if(x < y) [x, y] = [y, x];
    return super.get(x, y, 0);
  }

  set(x, y, val){
    if(x < y) [x, y] = [y, x];
    super.set(x, y, val);
  }
};