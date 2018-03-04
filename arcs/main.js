'use strict';

var O = require('../framework');
var media = require('../media');
var logStatus = require('../log-status');

var w = 450;
var h = 150;
var fps = 10;
var hd = true;
var duration = 30;
var framesNum = fps * duration;

var cols = {
  bg: '#dedede',
  empty: '#33485d',
  full: '#ecf0f1',
  text: '#181244',
};

setTimeout(main);

function main(){
  var [wh, hh] = [w, h].map(a => a / 2);

  var circs = [
    [9, 500, 'days'],
    [1, 24, 'hours'],
    [16, 60, 'minutes'],
    [56, 60, 'seconds'],
  ];

  var radius = 50;
  var size = w / circs.length;
  var sizeH = size / 2;

  require('../media/node_modules/canvas').registerFont('C:\\Users\\Thomas\\Downloads\\Merienda-FontZillion\\Fonts\\merienda-regular.ttf', {family: 'merienda-regular'});

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f % fps === 1){
      g.fillStyle = cols.bg;
      g.fillRect(0, 0, w, h);

      circs.forEach((circ, index) => {
        var x = sizeH + size * index;
        var y = hh;

        g.lineWidth = 5;

        g.strokeStyle = cols.empty;
        g.beginPath();
        g.arc(x, y, radius, 0, Math.PI * 2);
        g.stroke();

        g.strokeStyle = cols.full;
        g.beginPath();
        g.arc(x, y, radius, -Math.PI * 2 * circ[0] / circ[1], 0, false);
        g.stroke();

        g.fillStyle = cols.text;
        g.textAlign = 'center';

        g.textBaseline = 'bottom';
        g.font = '30px merienda-regular';
        g.fillText(circ[0].toString().padStart(2, '0'), x, y + 32 / 4);

        g.textBaseline = 'top';
        g.font = '15px merienda-regular';
        g.fillText(circ[2].toUpperCase(), x, y - 16 / 4);

        if(index === circs.length - 1){
          circ[0]--;
        }
      });
    }

    return f !== framesNum;
  });
}