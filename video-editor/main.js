'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const Presentation = require('../presentation');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const inputFile = '-dw/1.mp4';
const outputFile = getOutputFile(1);

setTimeout(main);

async function main(){
  var pr = new Presentation(w, h, fps, fast);
  pr.verbose = 0;

  pr.render(outputFile, async (w, h, g, g1) => {
    var captions = [
      'Wait for it to download',
      'After extracting',
    ];

    var vidsNum = 3;
    var vidNum = 0;

    for(var i = 0; i !== vidsNum; i++){
      var vid = await nextVid();
      var {framesNum} = vid;
      
      while(vid.hasMore()){
        var frame = await vid.frame();

        var {f} = vid;
        media.logStatus(f, framesNum, `video ${vidNum} frame`);

        g.drawImage(frame.canvas, 0, 0);

        if(vidNum === 3){
          if(f >= 4964 && f <= 5428){
            g.textBaseline = 'top';
            g.textAlign = 'left';
            g.font = '72px arial';
            g.fillStyle = 'red';
            g.fillText('The password is "a"', 11, 53);

            var [x1, y1] = [312, 169];
            var [x2, y2] = [797, 582];

            var angle = Math.atan2(y1 - y2, x1 - x2);
            var angleDiff = O.pi / 6;
            var arrowLen = 20;

            var x3 = x2 + Math.cos(angle + angleDiff) * arrowLen;
            var y3 = y2 + Math.sin(angle + angleDiff) * arrowLen;
            var x4 = x2 + Math.cos(angle - angleDiff) * arrowLen;
            var y4 = y2 + Math.sin(angle - angleDiff) * arrowLen;

            g.lineCap = 'round';
            g.lineJoin = 'round';

            g.lineWidth = 3;
            g.strokeStyle = 'red';

            g.beginPath();
            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.lineTo(x3, y3);
            g.moveTo(x2, y2);
            g.lineTo(x4, y4);
            g.stroke();
          }
        }

        await pr.frame();
      }

      if(vidNum !== vidsNum)
        await caption(captions[vidNum - 1]);
    }

    async function nextVid(){
      var name = `D:/Test/${++vidNum}.mp4`;
      return await media.loadVideo(name);
    }

    async function caption(text, fade=1e3, wait=2e3){
      g.fillStyle = 'black';
      g.fillRect(0, 0, w, h);

      g1.textBaseline = 'middle';
      g1.textAlign = 'center';
      g1.font = '72px arial';
      g1.fillStyle = 'darkgray';
      g1.fillText(text, wh, hh);

      await pr.fade(fade);
      await pr.wait(wait);
      await pr.fadeOut(fade);
    }
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}