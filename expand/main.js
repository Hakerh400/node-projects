'use strict';

const HD = 1;
const SCALE = !HD;
const WAIT_AFTER_END = HD;
const RANDOM = 1;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const Presentation = require('../presentation');
const ImageData = require('../image-data');

const TIME_TO_WAIT = 5e3;

const wt = HD ? 1920 : 640;
const ht = HD ? 1080 : 480;

const fps = 60;
const fast = !HD;

const inputFile = '-dw/1.png';
const outputFile = getOutputFile();

setTimeout(() => main().catch(log));

async function main(){
  var img = await media.loadImage(inputFile);
  if(SCALE) img = media.scale(img, wt, ht);

  const {canvas} = img;
  const pr = new Presentation(canvas.width, canvas.height, fps, fast);
  pr.verbose = 0;

  const col = Buffer.alloc(3);

  await pr.render(outputFile, async (w, h, g, g1) => {
    const [wh, hh] = [w, h].map(a => a >> 1);
    const pixelsNum = w * h;

    const sp = 1 / (fps * 10);

    await O.repeata(fps * 60 * 60, async (i, ki, ni) => {
      media.logStatus(i + 1, ni);

      var radius = h * (2 + Math.sin(i * sp)) * .15;
      var s = h * .2;
      var sh = s / 2;

      g.fillStyle = 'black';
      g.fillRect(0, 0, w, h);

      O.repeat(5, (j, kj, nj) => {
        var p = (j + 1) / nj;
        var k = (p + i * p * sp) % 1;

        draw(k, () => {
          g.fillStyle = new O.Color(128 + kj * 127);
          g.beginPath();
          g.arc(0, 0, 1, 0, O.pi2);
          g.fill();
        });
      });

      await render(wh, hh);

      function draw(k, func){
        var angle = (ki + k) * O.pi2;
        var x = wh + Math.cos(angle) * radius;
        var y = hh + Math.sin(angle) * radius;

        g.translate(x, y);
        g.scale(s, s);
        func();
        g.resetTransform();
      }
    });

    if(WAIT_AFTER_END)
      await pr.wait(TIME_TO_WAIT);

    async function render(x, y){
      var pixelsDone = 0;

      const dImg = new ImageData(g);

      const d = new O.SimpleGrid(w, h, (x, y) => {
        dImg.get(x, y, col);

        var v = Math.round((col[0] + col[1] + col[2]) / 3);
        v = v ** 2 >> 8;

        return v;
      });

      const dPix = new O.SimpleGrid(w, h, () => 0);
      const dg = new ImageData(g);

      dg.iterate((x, y) => {
        var v = d.get(x, y);
        return [v, v, v];
      });

      dPix.set(x, y, 1);
      const queue = [[[x, y]]];

      var epoch = -1;

      while(queue.length !== 0){
        epoch++;

        var elems = queue.shift();
        if(elems.length === 0) continue;

        var k = epoch / (256 * 6);
        O.hsv(k % 1, col);

        for(var [x, y] of elems){
          dg.set(x, y, col);
          pixelsDone++;

          d.adj(x, y, (x, y, v) => {
            if(!d.has(x, y) || dPix.get(x, y)) return;
            dPix.set(x, y, 1);

            v += 2;
            if(RANDOM) v = O.rand(v);
            else v >>= 1;

            while(v >= queue.length) queue.push([]);
            queue[v].push([x, y]);
          });
        }
      }

      dg.put();
      await pr.frame();
    }
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}