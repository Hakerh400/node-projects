'use strict';

var O = require('../framework');
var media = require('../media');
var entities = require('./entities.js');

const RADIUS = 8;
const DIAMETER = RADIUS * 2;

var w = 640;
var h = 480;
var fps = 60;
var hd = true;
var duration = 20;
var framesNum = fps * duration;

var fontSize = 16;
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
      ent.draw();
      ent.tick();
    });

    drawClans(g, ents);

    return f !== framesNum;
  });
}

function initEnts(g, ents){
  O.repeat(100, i => {
    var x = RADIUS + O.randf(w - DIAMETER);
    var y = RADIUS + O.randf(h - DIAMETER);
    var radius = RADIUS;
    var clan = i === 0 ? 0 : 1;
    var dir = O.randf(O.pi2);
    var speed = 0;

    var ent = new entities.Player(g, ents, x, y, radius, dir, speed, clan);

    ents.push(ent);
  });

  O.repeat(10, i => {
    var x = RADIUS / 2 + O.randf(w - RADIUS);
    var y = RADIUS / 2 + O.randf(h - RADIUS);
    var radius = RADIUS / 2;

    var ent = new entities.Gem(g, ents, x, y, radius);

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