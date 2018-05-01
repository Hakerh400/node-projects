'use strict';

var O = require('../framework');
var media = require('../media');
var svg = require('.');

setTimeout(main);

function main(){
  var name = 'check';
  var src = require('fs').readFileSync(require('path').join(O.dirs.dw, `${name}.svg`), 'utf8');
  var [w, h, code] = svg.svg2ctx(src, 'g');
  var func = new Function('g', code);

  console.log(code);

  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'red';
    func(g);
    g.fill();
    g.stroke();
  });
}