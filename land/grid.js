'use strict';

const O = require('../framework');
const biomes = require('./biomes');

const cols = [
  [169, 169, 169],
  [255, 0, 0],
  [255, 255, 0],
  [0, 255, 0],
  [0, 255, 255],
];

class Grid{
  constructor(world){
    this.world = world;

    this.d = O.obj();

    var {ws:w, hs:h} = this.world;
    this.coords = new Coordinates(O.ca(w * h, i => {
      var x = i % w;
      var y = i / w | 0;

      return [x, y];
    }).filter(([x, y]) => O.dist(x, y,w/2,h/2) > 5));
    this.active = new Coordinates([this.coords.splice()]);
  }

  tick(){
    var {coords, active} = this;
    if(active.len() === 0) return;

    var land, stability, type, struct, tex;

    for(var i = 0; i !== 1; i++){
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

      land = stability = struct = tex = void 0;

      if(adj.length === 0){
        land = 1;
      }

      d = new Tile(land, stability, struct, tex);
      this.set(x, y, d);

      var index;

      if((index = coords.indexOf(x, y - 1)) !== -1) active.add(coords.splice(index));
      if((index = coords.indexOf(x - 1, y)) !== -1) active.add(coords.splice(index));
      if((index = coords.indexOf(x, y + 1)) !== -1) active.add(coords.splice(index));
      if((index = coords.indexOf(x + 1, y)) !== -1) active.add(coords.splice(index));
    }
  }

  draw(){
    var {s, ws: w, hs: h, g} = this.world;

    g.scale(s);

    for(var y = 0; y !== h; y++){
      for(var x = 0; x !== w; x++){
        var d = this.get(x, y);

        if(d === null){
          g.fillStyle = 'black';
          g.fillRect(x, y, 1, 1);
          continue;
        }

        g.fillStyle = ['red','orange', 'yellow', '#ff00ff'][(x^y)&3];
        g.fillRect(x, y, 1, 1);
      }
    }

    g.resetTransform();
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
  constructor(land=0, stability=0, struct=null, tex=null){
    this.land = land;
    this.stability = stability;
    this.struct = struct;
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