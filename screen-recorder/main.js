'use strict';

const STABILIZE_FPS = 1;
const RECORD_CURSOR = 1;
const VERBOSE = 0;

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const readline = require('../readline');
const media = require('../media');
const Presentation = require('../presentation');
const scs = require('../screenshot');
const vi = require('../virtual-input');
const setPriority = require('../set-priority');

const TIMEOUT = 0;

const cwd = __dirname;
const curImgPath = path.join(cwd, 'cursor.png');

const w = 1920;
const h = 1080;
const fps = STABILIZE_FPS ? 30 : 60;
const fast = 1;

const [wh, hh] = [w, h].map(a => a >> 1);

var rl = readline.rl();
var rec = 0;

setTimeout(() => main().catch(log));

async function main(){
  await setPriority();
  media.setPriority();

  startRecording();
  aels();
}

function aels(){
  rl.on('line', onInput)
}

async function onInput(str){
  if(str === ''){
    rl.close();
    stopRecording();
  }
}

async function startRecording(){
  if(rec !== 0){
    info('Screen recording is already started');
    return;
  }

  info('Starting screen recording');
  rec = 2;

  var cur = await media.loadImage(curImgPath);
  var imgd, data;

  var pr = new Presentation(w, h, fps, fast);
  pr.verbose = 0;

  return await new Promise(async res => {
    pr.render('-vid/1.mp4', async (w, h, g, g1) => {
      imgd = g.createImageData(w, h);
      data = imgd.data;

      setTimeout(() => {
        res();
      }, TIMEOUT);

      var timeStart = Date.now();
      var f = 1;

      while(rec === 2)
        await frame();

      rec = 0;

      async function frame(){
        scs.take(data, 0, 0, w, h);

        g.putImageData(imgd, 0, 0);

        if(RECORD_CURSOR)
          g.drawImage(cur.canvas, vi.cx(), vi.cy());

        if(STABILIZE_FPS){
          while(1){
            var dt = Date.now() - timeStart;
            var ff = dt / 1e3 * fps;

            if(ff > f){
              f++;
              await pr.frame();
              continue;
            }

            break;
          };
        }else{
          await pr.frame();
        }
      }
    });
  });
}

async function stopRecording(){
  if(rec !== 2){
    info('Screen recording is already stopped');
    return;
  }

  info('Stopping screen recording');
  await sleep();

  rec = 1;
  await O.while(() => rec !== 0);
}

async function launchChrome(){
  info('Launching chrome 67.0.3396.87');
  await sleep();

  cp.spawn('cmd', [
    '/k', 'chrome',
  ], {
    stdio: 'ignore',
    windowsHide: true,
  });
}

async function sleep(){
  await O.sleep(TIMEOUT);
}

function info(msg){
  if(!VERBOSE) return;
  log(msg);
}