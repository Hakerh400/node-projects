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

    this.col = Buffer.alloc(3);
    this.col1 = Buffer.alloc(3);

    this.cols = [];

    this.analyze();
  }

  analyze(){
    var {w, h, img, col, col1, cols} = this;

    this.grid = new O.SimpleGrid(w, h, (x, y) => {
      img.get(x, y, col);

      var index = cols.findIndex(c => {
        return c.equals(col);
      });

      if(index === -1){
        index = cols.length;
        cols.push(Buffer.from(col));
      }

      return new Tile(index);
    });

    this.cols = cols;
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

    func({type: evts.FINISH});

    async function processArea(x, y, col){
      var area = new O.Set2D();
      var borders = new O.Set2D();
      var visibleBorders = new O.Set2D();

      var cs = [0, 0];
      var first = 1;

      grid.iterAdj(x, y, (x, y, d) => {
        if(d.col !== col) return 0;

        area.add(x, y);

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

      var areaArr = area.getArr();
      var first = 1;

      while(1){
        var csArr = borders.getArr();
        if(csArr.length === 0) break;

        var [xs, ys] = cs = csArr[0];

        var drawing = visibleBorders.has(xs, ys);
        var dir = borders.get(xs, ys) - 1;
        var ddir = first ? -1 : 1;

        if(drawing){
          await func({type: evts.MOVE_PEN, x: xs, y: ys});
          await func({type: evts.DRAW_START});
        }

        do{
          var drawingPrev = drawing;
          var dirPrev = dir;

          [x, y] = cs;

          area.remove(x, y);
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
            if(drawingPrev) await func({type: evts.DRAW_STOP});
            await func({type: evts.MOVE_PEN, x: cs[0], y: cs[1]});
            if(drawing) await func({type: evts.DRAW_START});
          }else if(drawing !== drawingPrev){
            if(drawing) await func({type: evts.DRAW_START});
            else await func({type: evts.DRAW_STOP});
          }
        }while(cs[0] !== xs || cs[1] !== ys);

        if(drawing) await func({type: evts.DRAW_STOP});

        first = 0;
      }

      areaArr.forEach(([x, y]) => {
        grid.get(x, y).col = -1;
      });
    }
  }
};

class Tile{
  constructor(col, done=0){
    this.col = col;
    this.done = done;
  }
};

Paint.evts = evts;
Paint.Tile = Tile;

module.exports = Paint;