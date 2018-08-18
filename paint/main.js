'use strict';

const HD = 0;

const O = require('../framework');
const media = require('../media');
const Presentation = require('../presentation');
const Paint = require('.');

const {evts} = Paint;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

setTimeout(main);

async function main(){
  var img = await media.loadImage('-dw/1.png');

  var pr = new Presentation(w, h, fps, fast);
  pr.keepAlive = 1;

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    var paint = new Paint(img);

    paint.draw(async evt => {
      switch(evt.type){
        case evts.SET_COLOR:
          g.fillStyle = evt.col;
          break;

        case evts.MOVE_PEN:
          var [x, y] = evt.coords;
          g.fillRect(x, y, 1, 1);
          await pr.frame();
          break;

        case evts.FINISH:
          pr.finish();
          break;
      }
    });
  });
}