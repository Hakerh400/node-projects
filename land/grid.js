'use strict';

const O = require('../framework');

const types = O.enum([
  'CHASM',
  'FREE',
  'WALL',
  'LIQUID',
  'FIRE',
]);

const cols = [
  [169, 169, 169],
  [255, 0, 0],
  [255, 255, 0],
  [0, 255, 0],
  [0, 255, 255],
];

const [w, h] = [1920, 1080];

class Grid{
  constructor(){
    this.d = O.obj();

    this.coords = O.ca(w * h, i => {
      var x = i % w;
      var y = i / w | 0;

      return [x, y];
    });

    this.active = [O.randElem(this.coords, 1)];
  }

  tick(){
    var {coords, active} = this;
    if(active.length === 0) return;

    for(var i = 0; i !== 50; i++){
      if(active.length === 0) break;

      var [x, y] = O.randElem(active, 1);

      if(this.get(x, y) !== null){
        i--;
        continue;
      }

      var adj = [];
      var d;

      if((d = this.get(x, y - 1)) !== null) adj.push(d);
      if((d = this.get(x - 1, y)) !== null) adj.push(d);
      if((d = this.get(x, y + 1)) !== null) adj.push(d);
      if((d = this.get(x + 1, y)) !== null) adj.push(d);

      var land, stability, type, stract, tex;

      if(adj.length === 0){
        land = 1;
      }

      d = new Tile(land, stability, type, stract, tex);
      this.set(x, y, d);

      var index;

      if((index = coords.findIndex(([xx, yy]) => xx === x && yy === y - 1)) !== -1) active.push(coords.splice(index, 1)[0]);
      if((index = coords.findIndex(([xx, yy]) => xx === x - 1 && yy === y)) !== -1) active.push(coords.splice(index, 1)[0]);
      if((index = coords.findIndex(([xx, yy]) => xx === x && yy === y + 1)) !== -1) active.push(coords.splice(index, 1)[0]);
      if((index = coords.findIndex(([xx, yy]) => xx === x + 1 && yy === y)) !== -1) active.push(coords.splice(index, 1)[0]);
    }
  }

  draw(imgd){
    for(var y = 0; y !== h; y++){
      for(var x = 0; x !== w; x++){
        var d = this.get(x, y);

        if(d === null){
          imgd.setRgb(x, y, 0, 0, 0);
          continue;
        }

        imgd.set(x, y, cols[d.land]);
      }
    }

  }

  get(x, y){
    var {d} = this;
    if(!(y in d)) return null;

    d = d[y];
    if(!(x in d)) return null;

    return d[x];
  }

  set(x, y, tile){
    var {d} = this;
    if(!(y in d)) d[y] = O.obj();
    d[y][x] = tile;
  }
};

class Tile{
  constructor(land=0, stability=0, type=types.CHASM, stract=null, tex=null){
    this.land = land;
    this.stability = stability;
    this.type = type;
    this.stract = stract;
    this.tex = tex;
  }
};

Grid.Tile = Tile;

module.exports = Grid;