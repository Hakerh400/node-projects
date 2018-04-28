'use strict';

var O = require('../framework');
var media = require('../media');

class Presentation{
  constructor(w, h, fps){
    this.w = w;
    this.h = h;
    this.fps = fps;

    this.wh = w / 2;
    this.hh = h / 2;

    this.transTime = 2e3;

    this.file = null;
    this.func = null;
    this.g = null;
    this.g1 = null;
    this.g2 = null;
    this.f = null;
    this.time = null;

    this.started = false;
    this.finished = false;

    this.state = 0;
  }

  render(file, func){
    var {w, h, fps} = this;

    this.file = file;
    this.func = func;

    media.renderVideo(file, w, h, fps, (w, h, g, f) => {
      if(!this.started){
        this.g = g;
        this.g1 = media.createContext(w, h);
        this.g2 = media.createContext(w, h);
        this.start();

        return null;
      }

      if(this.finished)
        return false;

      if(this.state === 2)
        this.state = 0;

      if(this.state === 0)
        return null;

      this.state = 2;

      media.logStatus(f);

      this.f = f;
      this.time = (f - 1) / fps * 1e3;

      return true;
    });
  }

  start(){
    var {w, h, g, g1} = this;

    this.started = true;
    this.func(w, h, g, g1).then(this.finish.bind(this));
  }

  finish(){
    this.finished = true;
  }

  async frame(){
    this.state = 1;

    await new Promise(res => {
      var f = () => {
        if(this.state !== 0)
          return setTimeout(f);
        res();
      };

      f();
    });
  }

  async wait(time = this.transTime){
    time += this.time;

    while(this.time < time)
      await this.frame();
  }

  async fade(time = this.transTime){
    var {g, g1, g2} = this;

    var ttime = this.time + time;
    var alpha = g.globalAlpha;

    g2.drawImage(g.canvas, 0, 0);

    while(this.time < ttime){
      g.globalAlpha = 1;
      g.drawImage(g2.canvas, 0, 0);
      g.globalAlpha = 1 - (ttime - this.time) / time;
      g.drawImage(g1.canvas, 0, 0);

      await this.frame();
    }

    g.globalAlpha = 1;
    g.drawImage(g1.canvas, 0, 0);

    g.globalAlpha = alpha;
  }

  async fadeOut(time = this.transTime){
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