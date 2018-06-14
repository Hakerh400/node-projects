'use strict';

var O = require('../framework');
var media = require('../media');

const OFFSET = .15;
const SCALE = 2;

var s = 400;
var sh = s / 2;

var c1 = new O.Color(203, 213, 222);
var c2 = new O.Color(128, 144, 157);

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', s, s, (w, h, g) => {
    g.clearRect(0, 0, s, s);

    g.fillStyle = c1;
    g.beginPath();
    g.arc(sh, sh, sh, 0, O.pi2);
    g.fill();

    var offset = s * OFFSET;
    g.translate(sh, sh + offset);
    g.scale(offset * SCALE, offset);

    g.fillStyle = c2;
    g.beginPath();
    g.moveTo(-.5, -1);
    g.ellipse(.5, 0, .5, 1, 0, -O.pih, 0);
    g.lineTo(1, .5);
    g.ellipse(1 - .5 / SCALE, .5, .5 / SCALE, .5, 0, 0, O.pih);
    g.lineTo(.5 / SCALE - 1, 1);
    g.ellipse(.5 / SCALE - 1, .5, .5 / SCALE, .5, 0, O.pih, O.pi);
    g.lineTo(-1, 0);
    g.ellipse(-.5, 0, .5, 1, 0, -O.pi, -O.pih);
    g.closePath();
    g.fill();

    g.resetTransform();

    g.lineWidth = 10;
    g.strokeStyle = c1;
    g.beginPath();
    g.arc(sh, sh - offset * .8, offset * 1.1, 0, O.pi2);
    g.fill();
    g.stroke();
  });
}