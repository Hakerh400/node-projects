'use strict';

var O = require('../framework');
var media = require('../media');
var entities = require('./entities.js');

const HD = 1;

const RADIUS = HD ? 10 : 4;
const DIAMETER = RADIUS * 2;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;
var hd = true;
var duration = HD ? 60 * 20 : 60 * 20;
var framesNum = fps * duration;

var fontSize = HD ? 32 : 16;
var fontOffset = 5;

var clans = entities.clans;
var ents = [];

var cols = {
  bg: 'darkgray',
  text: 'black',
};

setTimeout(main);

function main(){
  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      g.textBaseline = 'top';
      g.textAlign = 'left';

      initEnts(g, ents);
    }

    g.fillStyle = cols.bg;
    g.fillRect(0, 0, w, h);

    ents.forEach(ent => {
      ent.draw(f);
      ent.tick(f);
    });

    drawClans(g, ents);

    return f !== framesNum;
  });
}

function initEnts(g, ents){
  var num = 50;
  var rad = (RADIUS * num) / O.pi;

  O.repeat(4, clan => {
    var xx = [w * .25, w * .75][clan & 1];
    var yy = [h * .25, h * .75][clan >> 1];

    O.repeat(num, i => {
      var angle = i / num * O.pi2;

      var x = xx + rad * Math.cos(angle);
      var y = yy + rad * Math.sin(angle);
      var radius = RADIUS;
      var dir = angle;

      var ent = new entities.Player(g, ents, x, y, radius, dir, clan);

      ents.push(ent);
    });
  });

  O.repeat(10, i => {
    var x = RADIUS / 2 + O.randf(w - RADIUS);
    var y = RADIUS / 2 + O.randf(h - RADIUS);
    var radius = RADIUS / 2;

    var ent = new entities.Gem(g, ents, x, y, radius);
    ent.respawn();

    ents.push(ent);
  });
}

function drawClans(g, ents){
  g.font = `bold ${fontSize}px arial`;
  g.fillStyle = cols.text;

  clans.forEach((clan, index) => {
    var name = clan.name;
    var points = clan.points;

    var str = `${name}: ${points}`;

    g.fillText(str, fontOffset, fontOffset + fontSize * index);
  });
}

function randCol(){
  var cols = [
    '#ffff00',
    '#00ff00',
    '#ff8000',
    '#00ffff',
    '#ff00ff',
  ];

  return cols[O.rand(cols.length)];
}