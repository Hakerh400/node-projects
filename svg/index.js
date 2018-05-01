'use strict';

var O = require('../framework');

const OFFSET = 0;

module.exports = {
  svg2ctx,
};

function svg2ctx(src, ctxName='g', indent=0){
  var w = src.match(/[^a-z0-9]width\s*\=\s*"?\s*(\d+)/i)[1] | 0;
  var h = src.match(/[^a-z0-9]height\s*\=\s*"?\s*(\d+)/i)[1] | 0;
  var d = src.match(/[^a-z0-9]d\s*\=\s*"?\s*([^"]*)/i)[1].trim();

  var xs = 0, ys = 0;
  var x = 0, y = 0;

  var lines = [];
  var index = 0;

  console.log(d);

  for(var i = 0; i < d.length;){
    while(d[i] === ' ') i++;

    var c = d[i++];

    if(/[0-9\-\.]/.test(c)){
      c = 'l';
      if(index !== 1 && !rel)
        c = c.toUpperCase();
    }

    var cmd = c.toLowerCase();
    var rel = c === cmd;

    console.log(c, rel);

    switch(cmd){
      case 'm':
        [x, y] = coords(rel, 2);
        xs = x;
        ys = y;
        addLine('moveTo', x + OFFSET, y + OFFSET);
        break;

      case 'l':
        [x, y] = coords(rel, 2);
        addLine('lineTo', x + OFFSET, y + OFFSET);
        break;

      case 'h':
        var [xt] = coords(0, 1);
        if(rel) x += xt;
        else x = xt;
        addLine('lineTo', x + OFFSET, y + OFFSET);
        break;

      case 'v':
        var [yt] = coords(0, 1);
        if(rel) y += yt;
        else y = yt;
        addLine('lineTo', x + OFFSET, y + OFFSET);
        break;

      case 'z':
        //addLine('closePath');
        break;

      default:
        throw new SyntaxError(`Unrecognized command "${c}"`);
        break;
    }

    index++;
  }

  var code = lines.map(line => {
    return `${'  '.repeat(indent)}${line}`;
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

        first = 0;

        if(c === '+' || c === '-'){
          if(!first) break;
          first = 0;
          continue;
        }

        if(c === '.'){
          if(dot) break;
          dot = 1;
          continue;
        }

        break;
      }

      arr.push(+d.substring(i, --j));
      i = j;

      if(arr.length === num)
        break;
    }

    if(rel){
      arr[0] += x;
      arr[1] += y;
    }

    return arr;
  }

  function addLine(method, ...args){
    var line = `${ctxName}.${method}(${args.join(', ')});`;
    lines.push(line);
    return line;
  }
}