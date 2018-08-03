'use strict';

const O = require('../framework');
const biomes = require('./biomes');

const stabilityMin = 20;
const stabilityMax = 25;
const stabilityDropMin = -1;
const stabilityDropMax = .1;

const cols = [
  new O.Color(0, 0, 255),
  new O.Color(255, 0, 0),
  new O.Color(255, 255, 0),
  new O.Color(0, 255, 0),
  new O.Color(0, 255, 255),
  new O.Color(255, 128, 255),
  new O.Color(255, 128, 0),
];

const landsNum = cols.length;

class Grid{
  constructor(world){
    this.world = world;

    this.d = O.obj();

    var {ws:w, hs:h} = this.world;
    this.coords = new Coordinates(O.ca(w * h, i => {
      var x = i % w;
      var y = i / w | 0;

      return [x, y];
    }).filter(([x, y]) => x&&y&&x<w-1&&y<h-1));

    var arr = [];

    O.repeat(w, x => {
      O.repeat(2, y => {
        var land = O.rand(landsNum);
        var stability = O.randf(O.randf(stabilityMin, stabilityMax));

        this.set(x, y *= h - 1, new Tile(land, stability));
        arr.push([x, y ? y - 1 : y + 1]);
      });
    });

    O.repeat(h, y => {
      O.repeat(2, x => {
        var land = O.rand(landsNum);
        var stability = O.randf(O.randf(stabilityMin, stabilityMax));

        this.set(x *= w - 1, y, new Tile(land, stability));
        arr.push([x ? x - 1 : x + 1, y]);
      });
    });

    this.active = new Coordinates(arr.map(([x, y]) => {
      var index = this.coords.indexOf(x, y);
      if(index === -1) return null;
      return this.coords.splice(index);
    }).filter(a => a !== null));
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

      switch(adj.length){
        case 0:
          land = O.rand(landsNum);
          stability = O.randf(O.randf(stabilityMin, stabilityMax));
          break;

        case 1:
          if(adj[0].stability !== 0){
            land = adj[0].land;
            stability = adj[0].stability + O.randf(stabilityDropMin, stabilityDropMax);
          }else{
            do{
              land = O.rand(landsNum);
            }while(land === adj[0].land);
            stability = O.randf(stabilityMin, stabilityMax);
          }
          break;

        case 2: case 3: case 4:
          var dd = adj.reduce((d1, d2) =>{
            return d1.stability > d2.stability ? d1 : d2;
          });

          land = dd.land;
          stability = dd.stability + O.randf(stabilityDropMin, stabilityDropMax);

          break;
      }

      if(stability < 0)
        stability = 0;

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
  }

  get(x, y){
    var {d} = this;
    if(!(y in d)) return null;

    d = d[y];
    if(!(x in d)) return null;

    return d[x];
  }

  set(x, y, d){
    var {d: tiles} = this;
    if(!(y in tiles)) tiles[y] = O.obj();
    tiles[y][x] = d;

    var {s, ws: w, hs: h, g} = this.world;

    g.fillStyle = cols[d.land];
    g.fillRect(x * s, y * s, s, s);
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