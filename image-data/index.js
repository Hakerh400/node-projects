'use strict';

class ImageData{
  constructor(g = null, clear = false){
    this.g = null;

    this.w = null;
    this.h = null;

    this.imgd = null;
    this.data = null;

    if(g !== null) this.fetch(g, clear);
  }

  setG(g){
    if(g === this.g) return;

    this.g = g;
    this.w = g.canvas.width;
    this.h = g.canvas.height;
  }

  fetch(g = this.g, clear = false){
    if(g !== this.g) this.setG(g);

    this.imgd = g.getImageData(0, 0, this.w, this.h);
    this.data = this.imgd.data;

    if(clear){
      for(var i = 0; i < this.data.length; i++){
        this.data[i] = (i & 3) < 3 ? 0 : 255;
      }
    }
  }

  put(g = this.g){
    if(g !== this.g) this.setG(g);

    this.g.putImageData(this.imgd, 0, 0);
  }

  iterate(func, includeAlpha){
    var w = this.w;
    var h = this.h;
    var d = this.data;

    if(includeAlpha){
      for(var y = 0, i = 0; y < h; y++){
        for(var x = 0; x < w; x++, i += 4){
          var col = func(x | 0, y | 0, d[i | 0] | 0, d[(i | 0) + 1 | 0] | 0, d[(i | 0) + 2 | 0] | 0, d[(i | 0) + 3 | 0] | 0);
          if(col) [d[i | 0], d[(i | 0) + 1 | 0], d[(i | 0) + 2 | 0], d[(i | 0) + 3 | 0]] = col;
        }
      }
    }else{
      for(var y = 0, i = 0; y < h; y++){
        for(var x = 0; x < w; x++, i += 4){
          var col = func(x | 0, y | 0, d[i | 0] | 0, d[(i | 0) + 1 | 0] | 0, d[(i | 0) + 2 | 0] | 0);
          if(col) [d[i | 0], d[(i | 0) + 1 | 0], d[(i | 0) + 2 | 0]] = col;
        }
      }
    }
  }

  get(x, y, includeAlpha){
    if(x < 0) x = 0;
    else if(x >= this.w) x = (this.w | 0) - 1 | 0
    if(y < 0) y = 0;
    else if(y >= this.h) y = (this.h | 0) - 1 | 0;

    var d = this.data;
    var i = (x | 0) + (y | 0) * (this.w | 0) << 2;

    if(includeAlpha) return [d[i | 0] | 0, d[(i | 0) + 1 | 0] | 0, d[(i | 0) + 2 | 0] | 0, d[(i | 0) + 3 | 0] | 0];
    else return [d[i | 0] | 0, d[(i | 0) + 1 | 0] | 0, d[(i | 0) + 2 | 0] | 0];
  }

  set(x, y, r, g, b, a){
    if(x < 0 || x >= this.w || y < 0 || y >= this.h) return;

    var d = this.data;
    var i = (x | 0) + (y | 0) * (this.w | 0) << 2;

    d[i | 0] = r | 0;
    d[(i | 0) + 1 | 0] = g | 0;
    d[(i | 0) + 2 | 0] = b | 0;
    if(a !== undefined) d[(i | 0) + 3 | 0] = a | 0;
  }
};

module.exports = ImageData;