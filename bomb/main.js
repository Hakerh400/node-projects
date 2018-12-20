'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const format = require('../format');

const FACTOR = .9;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 120;
const framesNum = fps * duration;

const noteDuration = 1 / 4;
const startDelay = 0.025057;

const cwd = __dirname;
const fontFamily = 'Digital-7';
const fontFile = `-dw/${fontFamily}.ttf`;
const rhythmFile = path.join(cwd, 'rhythm.txt');
const outputFile = getOutputFile(1);

setTimeout(() => main().catch(log));

async function main(){
  media.registerFont(format.path(fontFile), {family: fontFamily});

  const tt = 1 / (fps * noteDuration);

  var rhythm = [0, startDelay]
    .concat(fs.readFileSync(rhythmFile, 'utf8')
    .replace(/(\d+)\[([^\]]*)\]/g, (m, num, chunk) => {
      num |= 0;
      chunk = ` ${chunk} `;
      return chunk.repeat(num);
    }).match(/ \d+/g)
    .map(t => Number(t)));

  var indexPrev = 0;
  var index = 0;

  var time = 25;
  var k = 0;

  function init(g){
    g.textBaseline = 'middle';
    g.textAlign = 'center';
  }

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1) init(g);

    k *= FACTOR;

    var dt = rhythm[index] -= tt;
    while(dt < 0){
      if(++index === rhythm.length) return 0;

      dt = rhythm[index] += dt;
      if(index >= 4 && (index & 1) === 0){
        if(time !== 0) time--;
        k = 1;
      }
    }

    var k1 = 1 - k;

    g.fillStyle = 'white';
    g.fillRect(0, 0, w, h);

    var text = format.time(time).substring(3);
    var font = 400;

    if(index >= 36) font += k * 100;
    g.font = `${font}px '${fontFamily}'`;

    g.fillStyle = 'black';
    if(index >= 20) g.fillStyle = new O.Color(Math.round(k * 255), 0, 0);

    var angle = 0;
    if(index >= 56){
      var i = (index - 56 >> 1);
      angle = calcAngle(i) * k + calcAngle(i + 1) * k1;
    }

    g.save();
    g.translate(wh, hh);
    g.rotate(angle);
    g.fillText(text, 0, 0);
    g.restore();

    return 1;
  }, () => {
    media.spawnFfmpeg(`-i "${format.path('-dw/1.mp4')}" -i "${format.path(path.join(cwd, '../music/songs/test.mp3'))}" -y -c copy "${format.path('-vid/1.mp4')}"`);
  });
}

function calcAngle(i){
  if((i & 1) === 0) return 0;
  var a = O.pi / 6;
  if(i & 2) a = -a;
  return a;
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-dw/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}