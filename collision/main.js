'use strict';

var O = require('../framework');
var media = require('../media');
var Entity = require('./entity');

var w = 640;
var h = 480;
var fps = 60;
var hd = true;
var duration = 20;
var framesNum = fps * duration;

var ents = [];

setTimeout(main);

function main(){
  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      initEnts(g, ents);
    }

    g.fillStyle = 'darkgray';
    g.fillRect(0, 0, w, h);

    ents.forEach(ent => {
      ent.draw();
      ent.tick();
    });

    return f !== framesNum;
  });
}

function initEnts(g, ents){
  //ents.push(new Entity(g, ents, w / 4, h / 2, 16, -O.pi / 180 * 5, 20));
  ents.push(new Entity(g, ents, w / 4 * 3, h / 2, 64, 0, 0));

  O.repeat(50, () => {
    ents.push(new Entity(g, ents, O.randf(w), O.randf(h), 16, O.randf(O.pi2), 3));
  });
}