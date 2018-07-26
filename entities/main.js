'use strict';

const HD = 1;
const SAVE_ENTS = 1;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const Machine = require('../functional/machine');
const formatFileName = require('../format-file-name');
const World = require('./world');

const cwd = __dirname;
const programDir = path.join(cwd, 'program');
const srcFile = path.join(programDir, 'src.txt');
const entsFile = formatFileName('-dw/ents.txt');

const ENTS_NUM = 1e4;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 60 * 10;
const framesNum = duration * fps;

const [wh, hh] = [w, h].map(a => a >> 1);
const [w1, h1] = [w, h].map(a => a - 1);

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile, 'ascii');
  var machine = new Machine(src);

  var imgd, world;

  function init(g){
    imgd = new ImageData(g);
    world = new World(w, h);

    //world.addEnt(1, machine, wh, hh);

    O.repeat(ENTS_NUM, i => {
      var team = 1;
      var m = createMachine();
      var x = wh;
      var y = hh;

      world.addEnt(team, m, x, y);
    });
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1)
      init(g);

    if(f % (fps * 5) === 0)
      refreshEnts();

    world.draw(imgd);
    world.tick();

    imgd.put();

    return f !== framesNum;
  }, () => {
    if(SAVE_ENTS)
      saveEnts(world.ents);
  });

  function refreshEnts(){
    world.ents.forEach((ent, index, arr) => {
      var {x, y} = ent;

      var b = x === 0 || y === 0 || x === w1 || y === h1;
      b = b || O.dist(x, y, wh, hh) < 30;
      b = b || ent.machine.error;

      if(b){
        var m = createMachine();
        ent = new World.Entity(world, ent.team, m, wh, hh);;
        arr[index] = ent;
      }
    });
  }
}

function createMachine(){
  var len = 10 + O.rand(300);
  var buff = Buffer.from(O.ca(len, () => O.rand(256)));

  return new Machine(buff);
}

function saveEnts(ents){
  var idents = [
    '0', '1',
    '==', '=', 'var', '[]',
    'move',
  ];

  var str = ents.map(ent => {
    return Machine.parse(ent.machine.compiled).toString().replace(/\d+/g, id => {
      id |= 0;
      if(id < idents.length) return idents[id];
      return id;
    });
  }).join('\n\n');

  fs.writeFileSync(entsFile, str);
}