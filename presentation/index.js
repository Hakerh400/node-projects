'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

class Presentation{
  constructor(w, h, fps, fast=0){
    this.w = w;
    this.h = h;
    this.fps = fps;
    this.fast = fast;

    this.wh = w / 2;
    this.hh = h / 2;

    this.framesNum = null;

    this.transTime = 2e3;
    this.timeK = 1e3 / fps;

    this.g1 = media.createContext(w, h);
    this.g2 = media.createContext(w, h);

    this.file = null;
    this.func = null;
    this.cb = null;

    this.mFrame = null;
    this.g = null;

    this.time = 0;

    this.verbose = 1;
    this.keepAlive = 0;

    this.finished = 0;
  }

  async render(file, func, cb=O.nop){
    const {w, h, fps, fast} = this;

    this.file = file;
    this.func = func;
    this.cb = cb;

    var mFrame = media.presentation(file, w, h, fps, fast, () => {
      this.finished = 1;
    });

    this.mFrame = mFrame;
    this.g = mFrame.g;

    await this.start();
  }

  async start(){
    const {w, h, g, g1} = this;

    this.started = true;
    await this.func(w, h, g, g1);

    if(!this.keepAlive)
      this.finish();
  }

  finish(){
    this.mFrame(false).then(async () => {
      await O.while(() => !this.finished);
      this.cb();
    });
  }

  async frame(arg=true){
    const {mFrame} = this;

    if(this.verbose)
      media.logStatus(mFrame.f, this.framesNum);
    
    await mFrame(arg);
    this.time += this.timeK;
  }

  async wait(time=this.transTime){
    var buff = this.g.canvas.toBuffer('raw');

    time += this.time;

    while(this.time < time)
      await this.frame(buff);
  }

  async fade(time=this.transTime){
    const {g, g1, g2} = this;

    var alpha = g.globalAlpha;
    var ttime = time;

    g2.drawImage(g.canvas, 0, 0);
    time += this.time;

    while(this.time < time){
      g.globalAlpha = 1;
      g.drawImage(g2.canvas, 0, 0);
      g.globalAlpha = O.bound(1 - (time - this.time) / ttime, 0, 1);
      g.drawImage(g1.canvas, 0, 0);

      await this.frame();
    }

    g.globalAlpha = 1;
    g.drawImage(g1.canvas, 0, 0);

    g.globalAlpha = alpha;
  }

  async fadeOut(time=this.transTime){
    const {w, h, g1} = this;

    g1.fillStyle = 'black';
    g1.fillRect(0, 0, w, h);

    await this.fade(time);
  }

  async caption(text, wait=this.transTime, fade=wait){
    const {w, h, wh, hh, g, g1} = this;

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    g1.fillStyle = 'black';
    g1.fillRect(0, 0, w, h);
    g1.fillStyle = 'darkgray';
    g1.fillText(text, wh, hh);

    await this.fade(fade);
    await this.wait(wait);
    await this.fadeOut(fade);
  }
}

module.exports = Presentation;