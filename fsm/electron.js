'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');
const media = require('../media');
const fsm = require('.');
const Node = require('./node');

const w = 1920;
const h = 937;

const main = () => {
  O.iw = w;
  O.ih = h;

  const ns = O.ca(20, () => new Node());

  ns[0].set(...[1, 4].map(a => ns[a])).final = 0;
  ns[1].set(...[4, 2].map(a => ns[a])).final = 0;
  ns[2].set(...[4, 3].map(a => ns[a])).final = 0;
  ns[3].set(...[4, 4].map(a => ns[a])).final = 1;
  ns[4].set(...[4, 4].map(a => ns[a])).final = 0;
  ns[5].set(...[0, 6].map(a => ns[a])).final = 0;
  ns[6].set(...[0, 7].map(a => ns[a])).final = 0;
  ns[7].set(...[0, 8].map(a => ns[a])).final = 0;
  ns[8].set(...[0, 9].map(a => ns[a])).final = 0;
  ns[9].set(...[0, 9].map(a => ns[a])).final = 0;

  ns[3].epsilons.push(...[0].map(a => ns[a]));

  const a = fsm.norm(ns[0]);

  log(fsm.genStr(a));

  O.glob.graph = a;

  global.O = O;
  require('C:/wamp/www/projects/graph-visualizer/main.js');
  const canvas = document.querySelector('canvas');
  const g = canvas.getContext('2d');

  media.saveImage('-img/1.png', g).
    then(() => O.exit()).catch(log);
}

try{ main(); }
catch(err){ O.exit(err); }