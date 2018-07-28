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

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
var z = 0;

class Grid{
  constructor(){
    this.d = O.obj();

    this.coords = new Coordinates(O.ca(w * h, i => {
      var x = i % w;
      var y = i / w | 0;

      return [x, y];
    }));

    this.active = new Coordinates([this.coords.splice(this.coords.indexOf(w>>1,h>>1))]);
  }

  tick(){
    var {coords, active} = this;
    if(active.len() === 0) return;
    z++;

    var land, stability, type, stract, tex;

    for(var i = 0; i !== 1e3; i++){
      if(active.len() === 0) break;

      var [x, y] = active.splice();

      if(this.get(x, y) !== null){
        throw 0;
        i--;
        continue;
      }

      var adj = [];
      var d;

      if(d = this.get(x, y - 1)) adj.push(d);
      if(d = this.get(x - 1, y)) adj.push(d);
      if(d = this.get(x, y + 1)) adj.push(d);
      if(d = this.get(x + 1, y)) adj.push(d);

      land = stability = type = stract = tex = void 0;

      if(adj.length === 0){
        land = 1;
      }

      land = (z / 3 | 0) % cols.length;

      d = new Tile(land, stability, type, stract, tex);
      this.set(x, y, d);

      var index;

      if((index = coords.indexOf(x, y - 1)) !== -1) active.add(coords.splice(index));
      if((index = coords.indexOf(x - 1, y)) !== -1) active.add(coords.splice(index));
      if((index = coords.indexOf(x, y + 1)) !== -1) active.add(coords.splice(index));
      if((index = coords.indexOf(x + 1, y)) !== -1) active.add(coords.splice(index));
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

class Coordinates{
  constructor(arr){
    this.arr = arr;
    this.obj = Coordinates.arr2obj(arr);
  }

  static arr2obj(arr){
    var obj = O.obj();

    arr.forEach(coords => {
      var [x, y] = coords;
      if(!(y in obj)) obj[y] = O.obj();
      obj[y][x] = coords;
    });

    return obj;
  }

  add(coords){
    var {arr, obj} = this;
    var [x, y] = coords;
    if(this.includes(x, y)) return;

    arr.push(coords);
    if(!(y in obj)) obj[y] = O.obj();
    obj[y][x] = coords;
  }

  splice(index=null){
    var {arr, obj} = this;
    if(index === null) index = O.rand(arr.length);

    var coords = arr.splice(index, 1)[0];
    var [x, y] = coords;

    obj[y][x] = null;

    return coords;
  }

  indexOf(x, y){
    if(!this.includes(x, y)) return -1;
    return this.arr.indexOf(this.obj[y][x]);
  }

  includes(x, y){
    var {obj} = this;
    if(!(y in obj)) return 0;
    return obj[y][x];
  }

  len(){
    return this.arr.length;
  }
};

Grid.Tile = Tile;
Grid.Coordinates = Coordinates;

module.exports = Grid;