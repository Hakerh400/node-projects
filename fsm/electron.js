'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');
const media = require('../media');
const fsm = require('.');
const Node = require('./node');

const w = 1920;
const h = 1080;

const main = () => {
  O.iw = w;
  O.ih = h;

  const ns = O.ca(8, () => new Node());

  ns[1].set(ns[1], ns[3]);
  ns[2].set(ns[7], ns[4]).final = 1;
  ns[3].set(ns[6], ns[5]);
  ns[4].set(ns[1], ns[4]).final = 1;
  ns[5].set(ns[1], ns[4]);
  ns[6].set(ns[7], ns[6]).final = 1;
  ns[7].set(ns[7], ns[3]);

  const a = fsm.reduce(ns[1]);
  a[1].name = 'C';
  a[1][1].name = 'D';
  a[1][0].name = 'B';

  O.glob.graph = a;

  global.O = O;
  require('C:/wamp/www/projects/graph-visualizer/main.js');
  const canvas = document.querySelector('canvas');
  const g = canvas.getContext('2d');

  media.saveImage('-img/1.png', g).
    then(() => O.exit()).catch(log);
}

main();