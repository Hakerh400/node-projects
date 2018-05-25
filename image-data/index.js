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

  iterate(func, includeAlpha = false){
    var w = this.w;
    var h = this.h;
    var d = this.data;

    if(includeAlpha){
      for(var y = 0, i = 0; y < h; y++){
        for(var x = 0; x < w; x++, i += 4){
          var col = func(x | 0, y | 0, d[i | 0] | 0, d[(i | 0) + 1 | 0] | 0, d[(i | 0) + 2 | 0] | 0, d[(i | 0) + 3 | 0] | 0);

          if(col){
            d[i | 0] = col[0] | 0;
            d[(i | 0) + 1 | 0] = col[1] | 0;
            d[(i | 0) + 2 | 0] = col[2] | 0;
            d[(i | 0) + 3 | 0] = col[3] | 0;
          }
        }
      }
    }else{
      for(var y = 0, i = 0; y < h; y++){
        for(var x = 0; x < w; x++, i += 4){
          var col = func(x | 0, y | 0, d[i | 0] | 0, d[(i | 0) + 1 | 0] | 0, d[(i | 0) + 2 | 0] | 0);
          
          if(col){
            d[i | 0] = col[0] | 0;
            d[(i | 0) + 1 | 0] = col[1] | 0;
            d[(i | 0) + 2 | 0] = col[2] | 0;
          }
        }
      }
    }
  }

  get(x, y, col, includeAlpha){
    if(x < 0) x = 0;
    else if(x >= this.w) x = (this.w | 0) - 1 | 0
    if(y < 0) y = 0;
    else if(y >= this.h) y = (this.h | 0) - 1 | 0;

    var d = this.data;
    var i = (x | 0) + (y | 0) * (this.w | 0) << 2;

    if(includeAlpha){
      col[0] = d[i | 0] | 0;
      col[1] = d[(i | 0) + 1 | 0] | 0;
      col[2] = d[(i | 0) + 2 | 0] | 0;
      col[3] = d[(i | 0) + 3 | 0] | 0;
    }else{
      col[0] = d[i | 0] | 0;
      col[1] = d[(i | 0) + 1 | 0] | 0;
      col[2] = d[(i | 0) + 2 | 0] | 0;
    }

    return col;
  }

  set(x, y, col, includeAlpha){
    if(x < 0 || x >= this.w || y < 0 || y >= this.h) return;

    var d = this.data;
    var i = (x | 0) + (y | 0) * (this.w | 0) << 2;

    if(includeAlpha){
      d[i | 0] = col[0] | 0;
      d[(i | 0) + 1 | 0] = col[1] | 0;
      d[(i | 0) + 2 | 0] = col[2] | 0;
      d[(i | 0) + 3 | 0] = col[3] | 0;
    }else{
      d[i | 0] = col[0] | 0;
      d[(i | 0) + 1 | 0] = col[1] | 0;
      d[(i | 0) + 2 | 0] = col[2] | 0;
    }
  }
};

module.exports = ImageData;