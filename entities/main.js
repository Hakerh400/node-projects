'use strict';

global.HD = 1;

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var media = require('../media');
var fsRec = require('../fs-recursive');
var worldModule = require('./world.js');

var entsExportDir = 'D:/Projects/JavaScript/Entities';
var clans = worldModule.clans;

global.FPS = 60;
global.INSTRUCTIONS_PER_FRAME = 100;
global.MUTATION_INTERVAL = FPS * 10;
global.MUTATION_FACTOR = .01;
global.MUTATION_DISPLAY_TIME = FPS * 1;

global.FONT_SIZE = HD ? 32 : 16;
global.FONT_OFFSET = 5;

global.TILE_SIZE = 40;

const RADIUS = HD ? 10 : 5;
const DIAMETER = RADIUS * 2;

global.CAPTION_BOX_WIDTH = ceilTileSize(250);
global.CAPTION_BOX_HEIGHT = ceilTileSize(FONT_OFFSET * 3 + clans.length * FONT_SIZE);
global.MAX_SPEED = HD ? 6 : 3;

global.ROT_SPEED = O.pi * .1;
global.FRICTION = .9;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;
var duration = HD ? 10 : 1;
var framesNum = fps * duration;

var [wh, hh] = [w, h].map(a => a >> 1);
var world = null;

setTimeout(main);

function main(){
  media.renderVideo('-vid/1.mp4', w, h, fps, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1)
      world = createWorld(g);

    world.draw(f);
    world.tick(f);

    return f !== framesNum;
  }, onRenderingDone);
}

function createWorld(g){
  var world = new worldModule.World(g, TILE_SIZE);
  createEnts(world);

  return world;
}

function createEnts(world){
  var playersPerClan = 5;
  var pointsNum = 10;

  O.repeat(clans.length, clan => {
    var xx = [w * .25, w * .75][clan & 1];
    var yy = [h * .25, h * .75][clan >> 1];

    O.repeat(playersPerClan, i => {
      var x = O.randf(w);
      var y = O.randf(h);
      var dir = O.randf(O.pi2);
      var isBot = clan === 0;

      var ent = new worldModule.Player(world, x, y, RADIUS, dir, clan, isBot);

      world.ents.push(ent);
    });
  });

  O.repeat(pointsNum, i => {
    var x = RADIUS / 2 + O.randf(w - RADIUS);
    var y = RADIUS / 2 + O.randf(h - RADIUS);

    var ent = new worldModule.Gem(world, x, y, RADIUS / 2);
    ent.respawn();

    world.ents.push(ent);
  });
}

function onRenderingDone(){
  exportEnts();
}

function exportEnts(){
  var ents = world.ents;

  fsRec.createDirSync(entsExportDir);
  fsRec.deleteFilesSync(entsExportDir);
  fs.mkdirSync(entsExportDir);

  var clansDir = path.join(entsExportDir, 'Clans');
  fs.mkdirSync(clansDir);

  clans.forEach((clan, id) => {
    clan.dir = path.join(clansDir, clan.name);
    fs.mkdirSync(clan.dir);
  });

  ents.forEach(ent => {
    if(!(ent instanceof worldModule.Player) || ent.dead)
      return;

    var clan = ent.clan;

    var hexFileName = `${ent.id}.hex`;
    var hexFilePath = path.join(clan.dir, hexFileName);

    fs.writeFileSync(hexFilePath, ent.machine.mem.buff);

    var txtFileName = `${ent.id}.txt`;
    var txtFilePath = path.join(clan.dir, txtFileName);

    var disassembled = ent.machine.disassemble();
    fs.writeFileSync(txtFilePath, disassembled);
  });
}

function ceilTileSize(val){
  return Math.ceil(val / TILE_SIZE) * TILE_SIZE;
}