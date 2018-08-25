'use strict';

const HD = 1;
const SEGMENTATE = 1;

const O = require('../framework');
const media = require('../media');
const Presentation = require('../presentation');
const Segmentator = require('../segmentator');
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

const outputFile = HD ? 'D:/Test/paint.mp4' : '-vid/1.mp4';

setTimeout(main);

async function main(){
  var img = await media.loadImage('-dw/1.jpeg');

  if(SEGMENTATE){
    img = Segmentator.img(img, COLS_NUM, EPOCHS_NUM);
    await saveImg(img, '-dw/1.png');
  }

  var pr = new Presentation(w, h, fps, fast);
  pr.keepAlive = 1;

  pr.render(outputFile, async (w, h, g, g1) => {
    var paint = new Paint(img);
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