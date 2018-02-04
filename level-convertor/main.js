'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');

const MAX_GRID_SIZE = 1000;

var dir = 'C:/Users/Thomas/Downloads';

setTimeout(main);

function main(){
  var input = path.join(dir, '1.txt');
  var output = path.join(dir, '2.txt');

  fs.writeFileSync(output, (a => {
    var bs = new O.BitStream();

    a = a.split(/\r\n|\r|\n/).filter(a => a.trim());

    var max = MAX_GRID_SIZE - 1;
    bs.write(a[0].length - 1, max);
    bs.write(a.length - 1, max);

    a.join``.split``.forEach(a => {
      var d = {
        player: '@'.includes(a) | 0,
        box: '$'.includes(a) | 0,
        target: '.'.includes(a) | 0,
        wall: '#'.includes(a) | 0,
      };

      bs.write(d.wall, 1);
      if(d.wall) return;

      bs.write(d.target, 1);
      bs.write(d.player, 1);
      if(d.player) return;

      bs.write(d.box, 1);
    });

    bs.pack();
    return bs.stringify(true);
  })(fs.readFileSync(input).toString()));
}