'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var readline = require('readline');
var O = require('../framework');
var media = require('../media');
var Presentation = require('../presentation');
var scs = require('../screenshot');
var vi = require('../virtual-input');

const TIMEOUT = 0;

const cwd = __dirname;
const curImgPath = path.join(cwd, 'cursor.png');

const w = 1920;
const h = 1080;
const fps = 30;
const fast = 1;

const [wh, hh] = [w, h].map(a => a >> 1);

var rl = readline.createInterface(process.stdin, process.stdout);
var rec = 0;

setTimeout(main);

function main(){
  media.flags.verbose = 0;
  askForInput();
}

function askForInput(){
  log('');
  rl.question('>', onInput);
}

async function onInput(str){
  switch(str){
    case 'start recording': await startRecording(); break;
    case 'stop recording': await stopRecording(); break;
    case 'launch chrome': await launchChrome(); break;
    default: log('Unknown command'); break;
  }

  askForInput();
}

async function startRecording(){
  if(rec !== 0){
    log('Screen recording is already started');
    return;
  }

  log('Starting screen recording');
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
        var img = scs.take(0, 0, w, h);

        for(var i = 0; i !== img.length; i++)
          data[i] = img[i];

        g.putImageData(imgd, 0, 0);
        g.drawImage(cur.canvas, vi.cx(), vi.cy());

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
      }
    });
  });
}

async function stopRecording(){
  if(rec !== 2){
    log('Screen recording is already stopped');
    return;
  }

  log('Stopping screen recording');
  await sleep();

  rec = 1;
  await O.while(() => rec !== 0);
}

async function launchChrome(){
  log('Launching chrome 67.0.3396.87');
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