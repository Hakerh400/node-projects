'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const browser = require('../browser');
const media = require('../media');
const Presentation = require('../presentation');

const url = '/?project=other-projects&sub-project=grid';

const SAMPLES_NUM = 100;
const WAIT_TIME = 10e3;
const FADE_TIME = 1e3;

const cc1 = O.cc(' ');
const cc2 = O.cc('~');

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const duration = 10;
const framesNum = fps * duration;

const tileSize = 40;
const tileSizeH = tileSize / 2;

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);

  window.addEventListener('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];

  var pr = new Presentation(w, h, fps, fast);
  pr.verbose = 0;

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    var len = O.sanl(get()).join('').length;

    for(var i = 0; i !== SAMPLES_NUM; i++){
      media.logStatus(i + 1, SAMPLES_NUM, 'sample');

      await put(randStr(), 2);
    }

    await pr.fadeOut(FADE_TIME);

    async function proc(render=0){
      window.emit('keydown', {code: 'Enter'});
      if(render) await draw();
    }

    async function put(str, render=0){
      str = String(str);
      if(str.length === 0) str = '0';

      var num = Math.ceil(len / str.length);
      set(str.repeat(num));

      if(render){
        await draw();
        if(render === 2) await proc(1);
      }
    }

    function get(){
      var evt = {type: 'export'};
      window.emit('_msg', evt);
      return evt.data;
    }

    async function set(data, render=0){
      data = String(data);
      window.emit('_msg', {type: 'import', data});
      if(render) await draw();
    }

    async function draw(){
      window.emit('keydown', {code: 'Digit1'});
      g1.drawImage(canvas, 0, 0);

      await pr.fade(FADE_TIME);
      await pr.wait(WAIT_TIME);
    }
  }, () => process.exit());

  function pressLetter(letter){
    pressKey(`Key${letter.toUpperCase()}`);
  }

  function pressKey(key){
    window.emit('keydown', {code: key});
    window.emit('keyup', {code: key});
  }
}

function randStr(){
  var len = O.randInt(2, .75);
  var str = O.ca(len, () => String.fromCharCode(O.rand(cc1, cc2))).join('');
  return str;
}