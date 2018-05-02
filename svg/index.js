'use strict';

var O = require('../framework');

const PRECISION = 8;

module.exports = {
  svg2ctx,
};

function svg2ctx(src, ctxName='g', indent=0){
  var w = src.match(/[^a-z0-9]width\s*\=\s*"?\s*(\d+)/i)[1] | 0;
  var h = src.match(/[^a-z0-9]height\s*\=\s*"?\s*(\d+)/i)[1] | 0;
  var d = src.match(/[^a-z0-9]d\s*\=\s*"?\s*([^"]*)/i)[1].trim();

  var xs = 0, ys = 0;
  var x = 0, y = 0;
  var xt, yt, tt;

  var lines = [];
  var index = 0;

  var prev = null;
  var next = null;

  var xp = null;
  var yp = null;

  for(var i = 0; i < d.length;){
    while(d[i] === ' ') i++;

    var c = d[i++];

    if(/[0-9\-\.]/.test(c)){
      if(next === null)
        throw new SyntaxError(`Unrecognized sequence type "${prev}"`);

      c = next;
      i--;

      if(index !== 1 && !rel)
        c = c.toUpperCase();
    }

    var cmd = c.toLowerCase();
    var rel = c === cmd;

    prev = c;
    next = null;

    switch(cmd){
      case 'm':
        [x, y] = coords(rel, 2);
        addLine('beginPath');
        addLine('moveTo', x, y);
        next = 'l';
        break;

      case 'l':
        [x, y] = coords(rel, 2);
        addLine('lineTo', x, y);
        next = 'l';
        break;

      case 'h':
        var [xt] = coords(0, 1);
        if(rel) x += xt;
        else x = xt;
        addLine('lineTo', x, y);
        next = 'h';
        break;

      case 'v':
        var [yt] = coords(0, 1);
        if(rel) y += yt;
        else y = yt;
        addLine('lineTo', x, y);
        next = 'v';
        break;

      case 'a':
        var [rx, ry, phi, fa, fs, x2, y2] = coords(0, 7);
        phi *= O.pi / 180;

        var x1 = x;
        var y1 = y;

        if(rel){
          x2 += xs;
          y2 += ys;
        }

        x = x2;
        y = y2;

        var cos = Math.cos(phi);
        var sin = Math.sin(phi);

        xt = (x1 - x2) / 2;
        yt = (y1 - y2) / 2;
        var x1p = cos * xt + sin * yt;
        var y1p = -sin * xt + cos * yt;

        xt = (x1 - x2) / 2;
        yt = (y1 - y2) / 2;
        var x1p = cos * xt + sin * yt;
        var y1p = -sin * xt + cos * yt;

        xt = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2;
        yt = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2;
        tt = Math.sqrt(xt / yt);
        var sign = fa !== fs ? 1 : -1;
        var cxp = sign * tt * rx * y1p / ry;
        var cyp = -sign * tt * ry * x1p / rx;

        xt = (x1 + x2) / 2;
        yt = (y1 + y2) / 2;
        var cx = cos * cxp - sin * cyp + xt;
        var cy = sin * cxp + cos * cyp + yt;

        xt = (x1p - cxp) / rx;
        yt = (y1p - cyp) / ry;
        var theta = vecAngle(1, 0, xt, yt);
        var dtheta = vecAngle(xt, yt, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

        theta = (theta % O.pi2 + O.pi2) % O.pi2;
        dtheta = (dtheta % O.pi2 + O.pi2) % O.pi2;
        if(!fs) theta -= O.pi2;

        addLine('ellipse', cx, cy, rx, ry, phi, theta, theta + dtheta, !fs);
        next = 'a';
        break;

      case 'c':
        var [x1, y1, x2, y2, x, y] = coords(rel, 6);
        addLine('bezierCurveTo', x1, y1, x2, y2, x, y);
        xp = x * 2 - x2;
        yp = y * 2 - y2;
        next = 'c';
        break;

      case 's':
        var [x2, y2, x, y] = coords(rel, 4);
        if(xp === null || yp === null){
          xp = (x2 + x) / 2;
          yp = (y2 + y) / 2;
        }
        var x1 = xp;
        var y1 = yp;
        addLine('bezierCurveTo', x1, y1, x2, y2, x, y);
        xp = x * 2 - x2;
        yp = y * 2 - y2;
        next = 's';
        break;

      case 'z':
        addLine('closePath');
        addLine('fill');
        addLine('stroke');
        break;

      default:
        throw new SyntaxError(`Unrecognized command "${c}"`);
        break;
    }

    if(cmd !== 'c' && cmd !== 's'){
      xp = null;
      yp = null;
    }

    xs = x;
    ys = y;

    index++;
  }

  var code = lines.map(line => {
    return O.indent(line, indent);
  }).join('\n');

  return [w, h, code];

  function coords(rel, num){
    var arr = [];
    var j = i;

    while(1){
      while(d[j] === ' ') j++;

      var dot = 0;
      var first = 1;

      while(1){
        var c = d[j++];
        if(c === ' ') break;

        if(/[0-9]/.test(c)){
          first = 0;
          continue;
        }

        if(c === '+' || c === '-'){
          if(!first) break;
          first = 0;
          continue;
        }

        first = 0;

        if(c === '.'){
          if(dot) break;
          dot = 1;
          continue;
        }

        break;
      }

      j--;
      arr.push(+d.substring(i, j));
      i = j;

      if(arr.length === num)
        break;
    }

    if(rel){
      for(var j = 0; j < num; j += 2){
        arr[j] += xs;
        arr[j + 1] += ys;
      }
    }

    return arr;
  }

  function addLine(method, ...args){
    if(lines.length === null)
      return;

    args = args.map(arg => {
      if(typeof arg !== 'number')
        return arg;

      return +arg.toFixed(PRECISION);
    });

    var line = `${ctxName}.${method}(${args.join(', ')});`;
    lines.push(line);
    
    return line;
  }
}

function vecAngle(x1, y1, x2, y2){
  var product = x1 * x2 + y1 * y2;
  var len1 = vecLen(x1, y1);
  var len2 = vecLen(x2, y2);
  var sign = x1 * y2 >= y1 * x2 ? 1 : -1;

  return sign * Math.acos(product / (len1 * len2));
}

function vecLen(x1, y1){
  return Math.sqrt(x1 ** 2 + y1 ** 2);
}