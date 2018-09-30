'use strict';

const HD = 1;

const O = require('../framework');
const media = require('../media');
const Presentation = require('../presentation');
const ImageData = require('../image-data');

const CIRCS_NUM = 2e5;
const SPEED = 1;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

setTimeout(main);

async function main(){
  var img = await media.loadImage('-dw/1.jpeg');
  var dImg = new ImageData(img);

  var pr = new Presentation(w, h, fps, fast);
  pr.verbose = 0;

  var col = Buffer.alloc(3);
  var col1 = Buffer.alloc(3);
  var col2 = Buffer.alloc(3);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    await pr.frame();

    var d = new ImageData(g1);
    var f = 0;
    var speed = 1;

    for(var i = 0; i !== CIRCS_NUM; i++){
      media.logStatus(i + 1, CIRCS_NUM, 'circle');
      
      speed = (i / 1e3 | 0) + 1;

      var x = O.rand(w);
      var y = O.rand(h);
      var r = 1;

      d.get(x, y, col);
      dImg.get(x, y, col1);

      if(col1.equals(col)){
        i--;
        continue;
      }

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
          g1.fillStyle = c;
          g1.beginPath();
          g1.arc(x, y, r, 0, O.pi2);
          g1.fill();

          d.fetch();
          await frame(1);

          break;
        }

        g.drawImage(g1.canvas, 0, 0);
        g.fillStyle = c;
        g.beginPath();
        g.arc(x, y, r, 0, O.pi2);
        g.fill();

        await frame();
      }
    }

    g.drawImage(g1.canvas, 0, 0);
    await pr.frame();

    async function frame(draw){
      if(++f >= SPEED){
        f = 0;
        if(draw) g.drawImage(g1.canvas, 0, 0);
        await pr.frame();
      }
    }
  });
}

function isIn(x, y){
  return x >= 1 && y >= 1 && x < w - 1 && y < h - 1;
}