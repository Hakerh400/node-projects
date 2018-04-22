'use strict';

var O = require('../framework');
var media = require('../media');
var nn = require('.');

const HD = 1;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;
var duration = 60;
var framesNum = fps * duration;

var speed = 5;

var entRadius = 16;
var gemRadius = 8;

setTimeout(main);

function main(){
  var model = nn.loadModel();

  var ent = new O.Vector(O.rand(w), O.rand(h));
  var gem = new O.Vector(O.rand(w), O.rand(h));

  media.renderVideo('-vid/1.mp4', w, h, fps, true, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    draw(g);
    tick();

    return f !== framesNum;
  });

  function tick(){
    var input = [ent.x / w, ent.y / h, gem.x / w, gem.y / h];
    var output = model.feed(input);

    ent.x += (output[0] * 2 - 1) * speed;
    ent.y += (output[1] * 2 - 1) * speed;

    if(ent.dist(gem) < entRadius + gemRadius){
      gem.x = O.rand(w);
      gem.y = O.rand(h);
    }
  }

  function draw(g){
    g.fillStyle = 'darkgray';
    g.fillRect(0, 0, w, h);

    g.fillStyle = '#00ff00';
    g.beginPath();
    g.arc(ent.x, ent.y, entRadius, 0, O.pi2);
    g.fill();
    g.stroke();

    g.fillStyle = '#ffff00';
    g.beginPath();
    g.arc(gem.x, gem.y, gemRadius, 0, O.pi2);
    g.fill();
    g.stroke();
  }
}