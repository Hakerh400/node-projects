'use strict';

const HD = 1;
const FILL = 1;

const WAIT_AFTER_END = HD;
const FADE_OUT = 0;

const O = require('../framework');
const media = require('../media');
const Presentation = require('../presentation');
const ImageData = require('../image-data');

const CIRCS_NUM = HD ? 500e3 : 100e3;
const SPEED_FACTOR = HD ? .01e-3 : 1e-3;
const TIME_TO_WAIT = 60e3 * 10;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const inputFile = '-dw/1.png';
const outputFile = HD ? 'D:/Render/circles.mp4' : '-vid/1.mp4';

setTimeout(main);

async function main(){
  var img = await media.loadImage(inputFile);
  var dImg = new ImageData(img);

  var pr = new Presentation(w, h, fps, fast);
  pr.verbose = 0;

  var col = Buffer.alloc(3);
  var col1 = Buffer.alloc(3);
  var col2 = Buffer.alloc(3);

  pr.render(outputFile, async (w, h, g, g1) => {
    await pr.frame();

    var d = new ImageData(g1);
    var speed = 1;
    var f = 0;

    for(var i = 0; i !== CIRCS_NUM; i++){
      speed = 1 + i * SPEED_FACTOR;

      var x = O.rand(w);
      var y = O.rand(h);
      var r = 1;

      d.get(x, y, col);
      dImg.get(x, y, col1);

      if(col1.equals(col)){
        i--;
        continue;
      }

      if((i & 1023) === 0)
        media.logStatus(i + 1, CIRCS_NUM, 'circle');

      var c = O.Color.from(col1);

      while(1){
        var circumference = r++ * O.pi2;
        var anglesNum = Math.ceil(circumference);
        var dAngle = O.pi2 / anglesNum;

        var angle = 0;
        var collision = 0;

        for(var j = 0; j !== anglesNum; j++){
          angle += dAngle;

          var x1 = Math.floor(x + Math.cos(angle) * r);
          var y1 = Math.floor(y + Math.sin(angle) * r);

          if(isIn(x1, y1)){
            d.get(x1, y1, col2);
            if(col2.equals(col)) continue;
          }

          collision = 1;
          break;
        }

        if(collision){
          g1.beginPath();
          g1.arc(x + .5, y + .5, r + 1 / speed - .5, 0, O.pi2);

          if(FILL){
            g1.fillStyle = c;
            g1.fill();
          }else{
            g1.strokeStyle = c;
            g1.stroke();
          }

          d.fetch();
          await frame(1);

          break;
        }

        g.drawImage(g1.canvas, 0, 0);
        g.beginPath();
        g.arc(x + .5, y + .5, r + 1 / speed - .5, 0, O.pi2);

        if(FILL){
          g.fillStyle = c;
          g.fill();
        }else{
          g.strokeStyle = c;
          g.stroke();
        }

        await frame();
      }
    }

    g.drawImage(g1.canvas, 0, 0);
    await pr.frame();

    log('');
    log('Enumerating remaining pixels');
    log('');

    d = new ImageData(g);
    var coords = [];

    d.iterate((x, y) => {
      dImg.get(x, y, col);
      d.get(x, y, col1);
      if(col1.equals(col)) return;

      coords.push([x, y]);
    });

    O.shuffle(coords);

    r = 1 + 1 / speed;
    if(FILL) speed *= r * r * O.pi;
    else speed *= r * O.pi2;

    var len = coords.length;
    var c = new O.Color(0, 0, 0);

    media.resetStatus();

    for(var i = 0; i !== len; i++){
      if((i & 1023) === 0)
        media.logStatus(i + 1, len, 'pixel');

      var [x, y] = coords[i];
      dImg.get(x, y, col);
      c.from(col);

      g.fillStyle = c;
      g.fillRect(x, y, 1, 1);
      await frame();
    }

    log('');
    log('Finalizing');

    if(WAIT_AFTER_END) await pr.wait(TIME_TO_WAIT);
    if(FADE_OUT) await pr.fadeOut(3e3);

    async function frame(draw=0){
      if(++f >= speed){
        f -= speed;
        if(draw) g.drawImage(g1.canvas, 0, 0);
        await pr.frame();
      }
    }
  }, exit);
}

function isIn(x, y){
  return x >= 1 && y >= 1 && x < w - 1 && y < h - 1;
}

function exit(){
  process.exit();
}