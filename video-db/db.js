'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class DB{
  constructor(){
    this.reset();
  }

  reset(){
    this.vids = new Set();
  }

  load(file){
    var str = fs.readFileSync(file, 'utf8').trim();
    if(str.length === 0){
      this.reset();
      return;
    }
    
    var vids = O.sanl(str);
    this.vids = new Set(vids);
  }

  save(file){
    var vids = Array.from(this.vids);
    fs.writeFileSync(file, vids.join('\n'));
  }

  add(vid){
    this.vids.add(vid);
  }

  has(vid){
    return this.vids.has(vid);
  }

  len(){
    return this.vids.size;
  }
}

module.exports = DB;