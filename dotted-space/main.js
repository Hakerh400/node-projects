'use strict';

const HD = 1;
const DISPLAY_DOTS = 0;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const Presentation = require('../presentation');
const ImageData = require('../image-data');
const DottedSpace = require('./dotted-space');
const Demo = require('./demo');
const Line = require('./line');

const TIME_TO_WAIT = 5e3;
const LINES_PER_FRAME = 100;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const linesNum = 1;
const space = 10;
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
    (w * h / space ** 2) / LINES_PER_FRAME +
    (pr.transTime * 5 + TIME_TO_WAIT) / 1e3 * fps
  ) | 0;

  await pr.render(outputFile, async (w, h, g, g1) => {
    const ds = new DottedSpace(w, h);

    let first = 1;

    g1.font = `${w * fontScale}px arial`;

    for(let demo of demos){
      if(!first){
        g.globalCompositeOperation = 'destination-over';
        g.fillStyle = 'black';
        g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'source-over';

        await pr.fadeOut();
      }

      first = 0;

      if(demos.length !== 1)
        await pr.caption(demo.name);

      if(DISPLAY_DOTS)
        g1.fillStyle = 'white';

      O.repeat(h, y => O.repeat(w, x => {
        if(!(x % space === 0 && y % space === 0)) return;

        let p = new O.Vector(x, y);
        demo.func(p);

        ds.add(p.x + .5, p.y + .5);

        if(DISPLAY_DOTS)
          g1.fillRect(p.x | 0, p.y | 0, 1, 1);
      }));

      if(DISPLAY_DOTS)
        await pr.fade();
      else
        await pr.frame();

      const lines = O.ca(linesNum, (i, k) => {
        let angle = O.pih - k * O.pi2;
        let radius = h / 4;

        let x = wh + Math.cos(angle) * radius;
        let y = hh - Math.sin(angle) * radius;

        let col = O.Color.from(O.hsv(k));

        return new Line(x, y, col);
      });

      g.clearRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-over';

      mainLoop: while(1){
        for(let i = 0; i !== LINES_PER_FRAME; i++){
          let line = O.randElem(lines);

          let {x, y} = line;
          let p = ds.nearest(x, y);
          if(p === null) break mainLoop;

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
      }

      g.globalCompositeOperation = 'source-over';

      await pr.frame();
      await pr.wait(TIME_TO_WAIT);
    }
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}