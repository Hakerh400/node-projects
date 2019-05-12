'use strict';

const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const evts = require('./evts');

class Paint{
  constructor(img){
    var canvas = img.canvas;

    this.w = canvas.width;
    this.h = canvas.height;
    this.img = new ImageData(img);

    this.col = createCol();
    this.cols = [];

    this.analyze();
  }

  analyze(){
    var {w, h, img, col} = this;

    var cols = new ColorsCollection();

    this.grid = new O.SimpleGrid(w, h, (x, y) => {
      img.get(x, y, col);
      var index = cols.add(col);
      return new Tile(index);
    });

    cols.getCols(this.cols);
  }

  async draw(func){
    var {w, h, cols, grid} = this;

    for(var colIndex = 0; colIndex !== cols.length; colIndex++){
      var col = cols[colIndex];
      await func({type: evts.SET_COLOR, col: O.Color.from(col)});

      for(var y = 0; y !== h; y++){
        for(var x = 0; x !== w; x++){
          if(grid.get(x, y).col !== colIndex) continue;
          await processArea(x, y, colIndex);
        }
      }
    }

    await func({type: evts.FINISH});

    async function processArea(x, y, col){
      var xStart = x;
      var yStart = y;

      var borders = new O.Map2D();
      var visibleBorders = new O.Map2D();

      var cs = [0, 0];
      var first = 1;

      grid.iterAdj(x, y, (x, y, d) => {
        if(d.col !== col) return 0;

        var ddir = first ? -1 : 1;
        var borderDir;

        var isBorder = grid.adj(x, y, (x, y, d, dir) => {
          borderDir = dir - ddir & 3;

          if(d === null) return 1;
          return d.col !== col;
        });

        if(isBorder){
          borders.add(x, y, borderDir++);

          var isVisible = grid.adj(x, y, (x, y, d) => {
            if(d === null) return;
            return d.col !== -1 && d.col !== col;
          });

          if(isVisible)
            visibleBorders.add(x, y, borderDir);

          first = 0;
        }

        return 1;
      });

      var visited = new O.Map2D();
      var flagDrawing = 0;
      var first = 1;
      var xc, yc;

      while(1){
        var csArr = borders.getArr();
        if(csArr.length === 0) break;

        var [xs, ys] = cs = csArr[0];

        var drawing = visibleBorders.has(xs, ys);
        var dir = borders.get(xs, ys) - 1;
        var ddir = first ? -1 : 1;

        if(drawing) await start();

        do{
          var drawingPrev = drawing;
          var dirPrev = dir;

          [x, y] = cs;
          borders.remove(x, y);

          dir = dir + ddir & 3;

          for(var i = 0; i !== 4; i++){
            var d = grid.nav(cs, dir);
            if(d !== null && d.col === col) break;

            grid.nav(cs, dir + 2 & 3);
            dir = dir - ddir & 3;
          }

          if(i === 4) break;

          drawing = visibleBorders.has(cs[0], cs[1]);

          if(dir !== dirPrev){
            if(drawingPrev) await stop();
            if(drawing) await start();
          }else if(drawing !== drawingPrev){
            if(drawing) await start();
            else await stop();
          }
        }while(cs[0] !== xs || cs[1] !== ys);

        if(drawing){
          [x, y] = cs;
          await stop();
        }

        first = 0;
      }

      visited.getArr().forEach(([x, y]) => {
        grid.get(x, y).col = -1;
      });

      x = xStart, y = yStart;

      if(grid.get(x, y).col === col){
        grid.iterAdj(x, y, (x, y, d) => {
          if(d.col !== col) return 0;

          d.col = -1;
          return 1;
        });

        await move(x, y);
        await func({type: evts.FILL});
      }

      async function move(x, y){
        if(flagDrawing){
          var xx = Math.min(xc, x);
          var yy = Math.min(yc, y);
          var dx = Math.abs(x - xc) + 1;
          var dy = Math.abs(y - yc) + 1;

          rect(xx, yy, dx, dy);
        }

        xc = x, yc = y;
        await func({type: evts.MOVE_PEN, x, y});
      }

      async function start(){
        await move(cs[0], cs[1]);
        await func({type: evts.DRAW_START});

        flagDrawing = 1;
      }

      async function stop(){
        await move(x, y);
        await func({type: evts.DRAW_STOP});

        flagDrawing = 0;
      }

      function rect(x1, y1, w, h){
        var x2 = x1 + w;
        var y2 = y1 + h;

        for(var y = y1; y !== y2; y++){
          for(var x = x1; x !== x2; x++){
            visited.add(x, y);
          }
        }
      }
    }
  }
}

class Tile{
  constructor(col, done=0){
    this.col = col;
    this.done = done;
  }
}

class ColorsCollection{
  constructor(){
    this.d = O.obj();
    this.size = 0;
  }

  get([r, g, b]){
    var {d} = this;

    if(!(r in d)) return null;
    d = d[r];

    if(!(g in d)) return null;
    d = d[g];

    if(!(b in d)) return null;
    return d[b];
  }

  add([r, g, b]){
    var {d} = this;

    if(!(r in d)) d[r] = O.obj();
    d = d[r];

    if(!(g in d)) d[g] = O.obj();
    d = d[g];

    if(!(b in d)) d[b] = ++this.size;
    return d[b] - 1;
  }

  len(){
    return this.size;
  }

  getCols(cols=[]){
    var {d} = this;

    cols.length = 0;

    O.keys(d).forEach(r => {
      var d1 = d[r];

      O.keys(d1).forEach(g => {
        var d2 = d1[g];

        O.keys(d2).forEach(b => {
          cols.push(Buffer.from([r, g, b]));
        });
      });
    });

    cols.sort((col1, col2) => {
      var i1 = this.get(col1);
      var i2 = this.get(col2);

      if(i1 < i2) return -1;
      return 1;
    });

    return cols;
  }
}

Paint.evts = evts;
Paint.Tile = Tile;
Paint.ColorsCollection = ColorsCollection;

module.exports = Paint;

function createCol(){
  return Buffer.alloc(3);
}