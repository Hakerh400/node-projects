'use strict';

var O = require('../framework');
var media = require('../media');

class Presentation{
  constructor(w, h, fps, fast=0){
    this.w = w;
    this.h = h;
    this.fps = fps;
    this.fast = fast;

    this.wh = w / 2;
    this.hh = h / 2;

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
  }

  render(file, func, cb=O.nop){
    var {w, h, fps, fast} = this;

    this.file = file;
    this.func = func;
    this.cb = cb;

    var mFrame = media.presentation(file, w, h, fps, fast);
    this.mFrame = mFrame;
    this.g = mFrame.g;

    this.start();
  }

  async start(){
    var {w, h, g, g1} = this;

    this.started = true;
    await this.func(w, h, g, g1);

    if(!this.keepAlive)
      this.finish.bind(this);
  }

  finish(){
    this.mFrame(false).then(() => {
      this.cb();
    });
  }

  async frame(){
    var {mFrame} = this;

    if(this.verbose)
      media.logStatus(mFrame.f);
    
    await mFrame(true);
    this.time += this.timeK;
  }

  async wait(time=this.transTime){
    time += this.time;

    while(this.time < time)
      await this.frame();
  }

  async fade(time=this.transTime){
    var {g, g1, g2} = this;

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
    var {w, h, g1} = this;

    g1.fillStyle = 'black';
    g1.fillRect(0, 0, w, h);

    await this.fade(time);
  }

  async caption(text, time=this.transTime, fadeOut=true){
    var {w, h, wh, hh, g, g1} = this;

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    g1.fillStyle = 'black';
    g1.fillRect(0, 0, w, h);
    g1.fillStyle = 'darkgray';
    g1.fillText(text, wh, hh);

    await this.fade(time);

    if(fadeOut)
      await this.fadeOut(time);
  }
};

module.exports = Presentation;