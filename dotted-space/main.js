'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const Presentation = require('../presentation');
const ImageData = require('../image-data');
const DottedSpace = require('./dotted-space');
const Demo = require('./demo');
const Line = require('./line');

const DISPLAY_DOTS = 1;
const TIME_TO_WAIT = 5e3;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const linesNum = 4;
const space = 20;
const maxDist = null;
const fontScale = .075;

const [wh, hh] = [w, h].map(a => a >> 1);
const spaceh = space / 2;

const outputFile = getOutputFile(1);

const demos = [
  new Demo('Square grid', p => {}),

  new Demo('Rotated square grid', p => {
    if(p.y / space & 1) p.x += spaceh;
    p.x *= Math.SQRT2;
  }),

  new Demo('Random distribution', p => {
    p.x = O.randf(w);
    p.y = O.randf(h);
  }),
];

setTimeout(() => main().catch(log));

async function main(){
  O.enhanceRNG();

  const pr = new Presentation(w, h, fps, fast);

  pr.framesNum = demos.length * (
    (w * h / space ** 2) / linesNum +
    (pr.transTime * 5 + TIME_TO_WAIT) / 1e3 * fps
  ) | 0;

  await pr.render(outputFile, async (w, h, g, g1) => {
    const ds = new DottedSpace(w, h);

    let first = 1;

    g1.font = `${w * fontScale}px arial`;

    for(let demo of demos){
      if(!first) await pr.fadeOut();
      first = 0;

      await pr.caption(demo.name);

      if(DISPLAY_DOTS)
        g1.fillStyle = 'white';

      O.repeat(h, y => O.repeat(w, x => {
        if(!(x % space === 0 && y % space === 0)) return;

        var p = new O.Vector(x + O.randf(1e-3) + .5, y + O.randf(1e-3) + .5);
        demo.func(p);

        ds.add(p.x, p.y);

        if(DISPLAY_DOTS)
          g1.fillRect(p.x | 0, p.y | 0, 1, 1);
      }));

      await pr.fade();

      var lines = O.ca(linesNum, (i, k) => {
        var x = O.randf(w);
        var y = O.randf(h);
        var col = O.Color.from(O.hsv(k));

        return new Line(x, y, col);
      });

      do{
        var active = 0;

        for(var line of lines){
          if(!line.active) continue;
          active = 1;

          var {x, y} = line;
          var p = ds.nearest(x, y);

          if(p === null || (maxDist !== null && p.dist(x, y) > maxDist)){
            line.active = 0;
            break;
          }

          ds.remove(p.x, p.y);

          line.x = p.x;
          line.y = p.y;

          g.strokeStyle = line.col;
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(p.x, p.y);
          g.stroke();
        }

        await pr.frame();
      }while(active);

      await pr.wait(TIME_TO_WAIT);
    }
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}