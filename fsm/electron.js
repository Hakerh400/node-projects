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

  const reg = /ABC|DE/;

  // const ns = O.ca(100, () => new Node());

  // ns[0].set(...[1, 3].map(a => ns[a])).final = 0;
  // ns[1].set(...[2, 2].map(a => ns[a])).final = 0;
  // ns[2].set(...[3, 3].map(a => ns[a])).final = 0;
  // ns[3].set(...[3, 3].map(a => ns[a])).final = 1;
  // ns[4].set(...[9, 5].map(a => ns[a])).final = 0;
  // ns[5].set(...[9, 6].map(a => ns[a])).final = 0;
  // ns[6].set(...[7, 9].map(a => ns[a])).final = 0;
  // ns[7].set(...[8, 9].map(a => ns[a])).final = 0;
  // ns[8].set(...[9, 9].map(a => ns[a])).final = 0;
  // ns[9].set(...[9, 9].map(a => ns[a])).final = 0;

  // ns[20].set(...[9, 9].map(a => ns[a])).final = 0;
  // ns[21].set(...[9, 9].map(a => ns[a])).final = 0;
  // ns[22].set(...[9, 9].map(a => ns[a])).final = 0;
  // ns[23].set(...[9, 9].map(a => ns[a])).final = 0;
  // ns[24].set(...[4, 9].map(a => ns[a])).final = 0;

  // ns[3].epsilons.push(...[20].map(a => ns[a]));

  // const a = fsm.norm(ns[0]);

  const a = fsm.reg(reg);

  for(const i of O.repeatg(20))
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