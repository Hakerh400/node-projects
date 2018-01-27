'use strict';

var fs = require('fs');

var password = require('./password.json');

var O = {
  /*
    Password
  */

  password,

  /*
    Constants
  */

  pi: Math.PI,
  pi2: Math.PI * 2,
  pih: Math.PI / 2,

  /*
    Main functions
  */

  init(){
    O.project = O.urlParam('project');

    if(!O.projectTest(O.project)) return O.error(`Illegal project name "${O.ascii(O.project).replace(/\"/gm, '\\"')}".`);

    if(O.project == null){
      O.rf(`projects.txt`, (status, projects) => {
        if(status != 200) return O.error(`Failed to load projects list.`);

        O.title('Projects');
        O.sortAsc(O.sanl(projects)).forEach((project, index, projects) => {
          O.ceLink(O.body, O.projectToName(project), `/?project=${project}`);
          if(index < projects.length - 1) O.ceBr(O.body);
        });
      });
    }else{
      O.rf(`/projects/${O.project}.js`, (status, script) => {
        if(status != 200) return O.error(`Failed to load script for project "${O.project}". Status code: ${status}.`);
        new Function('O', script)(O);
      });
    }
  },
  title(title){
    O.body.innerHTML = '';
    var h1 = O.ce(O.body, 'h1');
    O.ceText(h1, title);
  },
  error(msg){
    O.title('Error Occured');
    O.ceText(O.body, msg);
    O.ceBr(O.body, 2);
    O.ceLink(O.body, "Home Page", "/");
  },

  /*
    Project function
  */

  nonCapWords: 'a,an,the,at,by,for,in,of,on,to,up,and,as,but,or,nor'.split(','),
  projectTest(project){
    return /^[a-z0-9]+(?:\-[a-z0-9]+)*$/.test(project);
  },
  projectToName(project){
    return project.replace(/\-/g, ' ').replace(/[a-z0-9]+/g, word => {
      if(O.nonCapWords.indexOf(word) == -1) return word[0].toUpperCase() + word.substring(1);
      else return word;
    });
  },

  /*
    URL functions
  */

  urlParam(param){
    var match = O.href.match(new RegExp(`[\\?\\&]${param}=([^\\&]*)`));
    if(match == null){
      if(new RegExp(`[\\?\\&]${param}(?:\\&|$)`).test(O.href)) match = '';
    }else{
      match = unescape(match[1]);
    }
    return match;
  },

  /*
    DOM functions
  */

  ce(parent, tag){
    var elem = O.doc.createElement(tag);
    parent.appendChild(elem);
    return elem;
  },
  ceBr(elem, num = 1){
    while(num--) O.ce(elem, 'br');
  },
  ceText(elem, text){
    var t = document.createTextNode(text);
    elem.appendChild(t);
    return t;
  },
  ceLink(elem, text, href){
    var a = O.ce(elem, 'a');
    
    a.href = href;
    O.ceText(a, text);

    return a;
  },
  ceCanvas(enhanced = false){
    O.body.style.margin = '0px';

    var w = innerWidth;
    var h = innerHeight;
    var canvas = O.ce(O.body, 'canvas');
    var g = canvas.getContext('2d');

    canvas.width = w;
    canvas.height = h;
    g.fillStyle = 'white';
    g.strokeStyle = 'black';
    g.fillRect(0, 0, w, h);
    if(enhanced) g = new O.EnhancedRenderingContext(g);

    return {w, h, g};
  },

  /*
    Request processing functions
  */

  urlTime(url){
    var char = url.indexOf('?') != -1 ? '&' : '?';
    return `${url}${char}_=${Date.now()}`;
  },
  rf(file, cb){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
      if(xhr.readyState == 4){
        cb(xhr.status, xhr.responseText);
      }
    };
    xhr.open('GET', O.urlTime(file));
    xhr.send();
  },

  /*
    Constructors
  */

  Point: class{
    constructor(x, y){
      this.x = +x;
      this.y = +y;
    }
  },
  Grid: class{
    constructor(w, h, func){
      var grid = O.ca(w, x => O.ca(h, y => new O.PathTile(func(x, y))));
      grid.w = w;
      grid.h = h;
      grid.iterate = this.iterate.bind(grid);
      return grid;
    }
    iterate(func){
      var {w, h} = this;
      var x, y;
      for(y = 0; y < h; y++) for(x = 0; x < w; x++) func(x, y, this[x][y]);
    }
  },
  PathTile: class{
    constructor(wall){
      this.wall = wall;
      this.visited = false;
      this.heuristicDist = 0;
      this.pathDist = 0;
      this.totalDist = 0;
      this.dir = -1;
    }
  },
  EnhancedRenderingContext: class{
    constructor(g){
      this.g = g;

      this.s = 1;
      this.tx = 0;
      this.ty = 0;

      this.rtx = 0;
      this.rty = 0;
      this.rot = 0;
      this.rcos = 0;
      this.rsin = 0;

      this.fontSize = 32;
      this.fontScale = 1;

      [
        'fillStyle', 'strokeStyle', 'textAlign', 'textBaseline',
        'lineWidth'
      ].forEach(prop => {
        Object.defineProperty(this, prop, {
          set: val => g[prop] = val
        });
      });

      [
        'beginPath', 'closePath', 'clearRect', 'fill',
        'stroke', 'measureText'
      ].forEach(prop => this[prop] = g[prop].bind(g));

      this.fillStyle = 'white';
      this.strokeStyle = 'black';
      this.textAlign = 'center';
      this.textBaseline = 'middle';
    }
    resetTransform(){
      this.s = 1;
      this.tx = 0;
      this.ty = 0;
    }
    scale(s){
      this.s *= s;
    }
    translate(x, y){
      this.tx += this.s * x;
      this.ty += this.s * y;
    }
    rotate(x, y, angle){
      this.rot = angle;

      if(angle){
        this.rtx = x;
        this.rty = y;
        this.rcos = Math.cos(angle);
        this.rsin = -Math.sin(angle);
      }
    }
    rect(x, y, w, h){
      this.moveTo(x, y);
      this.lineTo(x + w, y);
      this.lineTo(x + w, y + h);
      this.lineTo(x, y + h);
      this.closePath();
    }
    fillRect(x, y, w, h){
      if(this.rot){
        this.g.beginPath();
        this.rect(x, y, w, h);
        this.fill();
        return;
      }

      this.g.fillRect(x * this.s + this.tx | 0, y * this.s + this.ty | 0, w * this.s | 0, h * this.s | 0);
    }
    moveTo(x, y){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;
      }

      this.g.moveTo((x * this.s + this.tx | 0) - .5, (y * this.s + this.ty | 0) - .5);
    }
    lineTo(x, y){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;
      }

      this.g.lineTo((x * this.s + this.tx | 0) - .5, (y * this.s + this.ty | 0) - .5);
    }
    arc(x, y, r, a1, a2, acw){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;

        a1 = (a1 - this.rot) % O.pi2;
        a2 = (a2 - this.rot) % O.pi2;
      }

      this.g.arc(x * this.s + this.tx - 1, y * this.s + this.ty - 1, r * this.s, a1, a2, acw);
    }
    fillText(text, x, y){
      if(this.rot){
        var xx = x - this.rtx;
        var yy = y - this.rty;

        x = this.rtx + xx * this.rcos - yy * this.rsin;
        y = this.rty + yy * this.rcos + xx * this.rsin;
      }

      this.g.fillText(text, x * this.s + this.tx | 0, y * this.s + this.ty | 0);
    }
    updateFont(){
      this.g.font = `${this.fontSize * this.fontScale}px arial`;
    }
    font(size){
      this.fontSize = size;
      this.updateFont();
    }
    scaleFont(scale){
      this.fontScale = scale;
      this.updateFont();
    }
  },
  BitStream: class{
    constructor(arr = null){
      this.arr = new Uint8Array(0);
      this.len = 0;
      this.bits = '';

      this.rIndex = 0;
      this.rBits = '';

      if(arr != null) this.parse(arr);
    }

    parse(arr){
      this.arr = Uint8Array.from(arr);
      this.len = this.arr.length;
    }

    writeByte(a){
      if(this.len == this.arr.length) this.arr = new Uint8Array([...this.arr, ...Array(this.len || 1)]);
      this.arr[this.len++] = a;
    }

    writeBits(a){
      this.bits += a;

      while(this.bits.length >= 8){
        a = this.bits.substring(0, 8);
        this.bits = this.bits.substring(8);
        this.writeByte(parseInt(a, 2));
      }
    }

    write(a, b = null){
      if(b == null) b = (1 << O.binLen(a)) - 1;

      b = b.toString(2);
      a = a.toString(2).padStart(b.length, '0');

      var eq = true;

      a = [...a].filter((v, i) => {
        if(!eq) return true;
        if(!+b[i]) return false;
        if(!+v) eq = false;
        return true;
      }).join('');

      this.writeBits(a);
    }

    pack(){
      if(this.bits) this.writeBits('0'.repeat(8 - this.bits.length));
    }

    getArr(){
      return O.ca(this.len + !!this.bits, i => {
        if(i < this.len) return this.arr[i];
        return parseInt(this.bits.padEnd(8, '0'), 2);
      });
    }

    readByte(a){
      if(this.rIndex == this.arr.length) return 0;
      return this.arr[this.rIndex++];
    }

    readBits(a){
      var bits = '';

      while(this.rBits.length < a) this.rBits += this.readByte().toString(2).padStart(8, '0');

      bits = this.rBits.substring(0, a);
      this.rBits = this.rBits.substring(a);

      return bits;
    }

    read(b = 255){
      var a;

      a = this.readBits(O.binLen(b));
      b = b.toString(2);

      var eq = true;
      var i = 0;

      b = [...b].map(v => {
        if(!eq) return a[i++];
        if(!+v) return 0;
        if(!+a[i]) eq = false;
        return +a[i++];
      }).join('');

      this.rBits = a.substring(i) + this.rBits;

      return parseInt(b, 2);
    }
  },

  /*
    String functions
  */

  ascii(str){
    return [...str].map(char => {
      var charCode = char.charCodeAt(0);
      if(charCode >= 32 && charCode <= 126) return char;
      else return '?';
    }).join('');
  },
  sanl(str){
    return str.split(/\r\n|\r|\n/gm);
  },
  pad(str, len, char = '0'){
    str += '';
    if(str.length >= len) return str;
    return char.repeat(len - str.length) + str;
  },

  /*
    Array functions
  */

  ca(len, func){
    return [...new Array(len)].map((elem, index) => func(index));
  },

  /*
    Other functions
  */

  repeat(num, func){
    var i;
    for(i = 0; i < num; i++) func(i);
  },
  rand(a){
    return Math.random() * a | 0;
  },
  bound(val, min, max){
    if(val < min) return min;
    if(val > max) return max;
    return val;
  },
  int(val, min = null, max = null){
    if(typeof val == 'object') val = 0;
    else val |= 0;
    if(min != null) val = O.bound(val, min, max);
    return val;
  },
  bool(val){
    return Boolean(O.int(val));
  },
  sortAsc(arr){
    return arr.sort((elem1, elem2) => elem1 > elem2 ? 1 : elem1 < elem2 ? -1 : 0);
  },
  sortDesc(arr){
    return arr.sort((elem1, elem2) => elem1 > elem2 ? -1 : elem1 < elem2 ? 1 : 0);
  },
  rgb(...col){
    return `#${col.map(val => O.pad((val | 0).toString(16), 2)).join('')}`;
  },
  binLen(a){
    return a && (Math.log2(a) | 0) + 1;
  },

  /*
    Algorithms
  */

  findPathAStar(grid, x1, y1, x2, y2){
    if(x1 == x2 && y1 == y2) return [];

    grid.iterate((x, y, d) => {
      d.visited = x == x1 && y == y1;
      d.heuristicDist = Math.abs(x - x2) + Math.abs(y - y2);
      d.pathDist = 0;
      d.totalDist = d.heuristicDist;
      d.dir = -1;
    });

    var {w, h} = grid;
    var distStep = 10;
    var nodes = [x1, y1];
    var x, y, dist, dir, i;
    var d1, d2;

    while(1){
      if(!nodes.length) return null;
      [x, y] = [nodes.shift(), nodes.shift()];
      if(Math.abs(x - x2) + Math.abs(y - y2) == 1) break;
      d1 = grid[x][y];

      if(y) visit(x, y - 1, 0);
      if(x) visit(x - 1, y, 1);
      if(y < h - 1) visit(x, y + 1, 2);
      if(x < w - 1) visit(x + 1, y, 3);
    }

    var path = [];
    if(y > y2) path.push(0);
    else if(x > x2) path.push(1);
    else if(y < y2) path.push(2);
    else path.push(3);

    while(1){
      if(x == x1 && y == y1) break;
      dir = grid[x][y].dir;
      path.unshift(dir);
      if(!dir) y++;
      else if(dir == 1) x++;
      else if(dir == 2) y--;
      else x--;
    }

    return path;

    function visit(xx, yy, dir){
      d2 = grid[xx][yy];
      if(d2.wall) return;
      dist = d2.heuristicDist + d1.pathDist + distStep;

      if(!d2.visited || d2.totalDist > dist){
        d2.visited = true;
        d2.pathDist = d1.pathDist + distStep;
        d2.totalDist = dist;
        d2.dir = dir;
        for(i = 0; i < nodes.length; i += 2) if(grid[nodes[i]][nodes[i + 1]].totalDist > dist) break;
        nodes.splice(i, 0, xx, yy);
      }
    }
  },

  /*
    Function which does nothing
  */

  nop(){}
};

module.exports = O;