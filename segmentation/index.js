'use strict';

const O = require('../framework');

class Segmentator{
  constructor(segsNum, segLen, min, max){
    this.segs = O.ca(segsNum, () => {
      return new Segment(segLen, min, max);
    });
  }

  iterate(func){
    this.segs.forEach((seg, index) => {
      func(seg, index);
    });
  }

  update(arrUpd){
    var seg = this.closestSeg(arrUpd);
    seg.update(arrUpd);
  }

  epoch(){
    this.iterate(seg => seg.epoch());
  }

  round(){
    this.iterate(seg => seg.round());
  }

  closest(arrUpd){
    return this.closestSeg(arrUpd).arr;
  }

  closestSeg(arrUpd){
    var index = this.closestIndex(arrUpd);
    return this.segs[index];
  }

  closestIndex(arrUpd){
    var dist = Infinity;
    var index = -1;

    this.iterate((seg, i) => {
      var d = seg.dist(arrUpd);

      if(d < dist){
        dist = d;
        index = i;
      }
    });

    return index;
  }
};

class Segment{
  constructor(len, min, max){
    this.arr = O.ca(len, () => {
      return min + O.randf(max - min);
    });

    this.arrNew = O.ca(len, () => 0);
    this.num = 0;
  }

  iterate(func){
    var {arr} = this;

    arr.forEach((val, index) => {
      var result = func(val, index);
      if(result != null) arr[index] = result;
    });
  }

  dist(arrUpd){
    var dist = 0;

    this.iterate((val, index) => {
      var d = arrUpd[index] - val;
      dist += d * d;
    });

    return Math.sqrt(dist);
  }

  update(arrUpd){
    var {arrNew} = this;

    arrNew.forEach((val, index) => {
      arrNew[index] += arrUpd[index];
    });

    this.num++;
  }

  epoch(){
    if(this.num === 0) return;
    var {arrNew, num} = this;

    this.iterate((val, index) => {
      var valNew = arrNew[index] / num;
      arrNew[index] = 0;
      return valNew;
    });

    this.num = 0;
  }

  round(){
    this.iterate(val => Math.round(val));
  }
};

module.exports = {
  Segmentator,
  Segment,
};