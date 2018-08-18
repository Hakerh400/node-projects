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

    var drawing = 0;
    var x, y;

    paint.draw(async evt => {
      switch(evt.type){
        case evts.SET_COLOR:
          g.fillStyle = evt.col;
          break;

        case evts.MOVE_PEN:
          if(drawing){
            g.fillrect(x, y, evt.x - x + 1, evt.y - y + 1);
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
          pr.finish();
          break;
      }
    });
  });
}