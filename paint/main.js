'use strict';

const HD = 1;
const SEGMENTATE = 0;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const Presentation = require('../presentation');
const Segmentator = require('../segmentator');
const fsRec = require('../fs-recursive');
const Paint = require('.');

const {evts} = Paint;

const COLS_NUM = 10;
const EPOCHS_NUM = 100;

const WAIT_AFTER_END = HD;
const TIME_TO_WAIT = 60e3;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const inputFile = SEGMENTATE ? '-dw/1.jpeg' : '-dw/1.png';
const outputFile = HD ? 'D:/Render/paint.mp4' : '-vid/1.mp4';

setTimeout(main);

async function main(){
  var outputDir = path.parse(outputFile).dir;

  if(!fs.existsSync(outputDir)){
    log('Creating output directory');
    fsRec.createDirSync(outputDir);
  }

  log('Loading image');
  var img = await media.loadImage(inputFile);

  if(SEGMENTATE){
    log('Segmentating');
    img = Segmentator.img(img, COLS_NUM, EPOCHS_NUM);
    await saveImg(img, '-img/1.png');
  }

  var pr = new Presentation(w, h, fps, fast);
  pr.keepAlive = 1;

  pr.render(outputFile, async (w, h, g, g1) => {
    log('Analyzing');
    var paint = new Paint(img);

    pr.framesNum = fps * 60 * 60 * 10;
    await pr.frame();

    var drawing = 0;
    var x, y;

    paint.draw(async evt => {
      switch(evt.type){
        case evts.SET_COLOR:
          g.fillStyle = evt.col;
          break;

        case evts.MOVE_PEN:
          if(drawing){
            var xx = Math.min(x, evt.x);
            var yy = Math.min(y, evt.y);
            var dx = Math.abs(evt.x - x) + 1;
            var dy = Math.abs(evt.y - y) + 1;

            g.fillRect(xx, yy, dx, dy);
            await pr.frame();
          }

          x = evt.x;
          y = evt.y;
          break;

        case evts.DRAW_START:
          drawing = 1;
          break;

        case evts.DRAW_STOP:
          drawing = 0;
          break;

        case evts.FINISH:
          if(WAIT_AFTER_END)
            await pr.wait(TIME_TO_WAIT);

          pr.finish();
          break;

        case evts.FILL:
          media.fill(g, x, y);
          await pr.frame();
          break;
      }
    });
  });
}

function saveImg(img, file){
  return new Promise(res => {
    img = img.canvas;
    
    var w = img.width;
    var h = img.height;
    
    media.renderImage(file, w, h, (w, h, g) => {
      g.drawImage(img, 0, 0);
    }, () => {
      res();
    });
  });
}