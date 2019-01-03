'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const s = 128;

const w = s;
const h = s;

const bgCol = new O.Color(207, 31, 37);
const fgCol = new O.Color(255, 255, 255);

const rad1 = .5 * (1 - 10 / 128);
const rad2 = .3;
const rad3 = .245;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    g.scale(w, h);
    g.clearRect(0, 0, 1, 1);

    arc(rad1, bgCol);
    arc(rad2, fgCol);
    arc(rad3, bgCol);

    g.lineCap = 'butt';
    g.lineWidth = rad2 - rad3 + .01;
    g.strokeStyle = fgCol;
    g.beginPath();
    point(O.pi * 5 / 4);
    point(O.pi / 4);
    g.stroke();

    function arc(radius, col){
      g.fillStyle = col;
      g.beginPath();
      g.arc(.5, .5, radius, 0, O.pi2);
      g.fill();
    }

    function point(angle){
      var rad = (rad2 + rad3) / 2;
      var x = .5 + Math.cos(angle) * rad;
      var y = .5 - Math.sin(angle) * rad;

      g.lineTo(x, y);
    }
  });
}