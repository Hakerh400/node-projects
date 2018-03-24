'use strict';

var path = require('path');
var cp = require('child_process');
var {Canvas} = require('../media/node_modules/canvas');
var O = require('../framework');
var logStatus = require('../log-status');
var formatFileName = require('../format-file-name');

const FFMPEG_DIR = 'C:/Program Files/Ffmpeg/bin/original';

const BGRA = '-f rawvideo -pix_fmt bgra';
const RGBA = '-f rawvideo -pix_fmt rgba';
const TRUNC = '-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"';
const HD_PRESET = '-c:v libx264 -preset slow -profile:v high -crf 18 -coder 1 -pix_fmt yuv420p -movflags +faststart -g 30 -bf 2 -c:a aac -b:a 384k -profile:a aac_low';

var procsNum = 0;

module.exports = {
  renderImage,
  editImage,
  renderVideo,
  editVideo,
  renderAudio,
  custom,
  spawnFfmpeg,
  blurRegion,
  createCanvas,
  createContext,
  logStatus,
  Canvas,
};

function renderImage(output, w, h, frameFunc, exitCb = O.nop){
  output = formatFileName(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');

  var proc = spawnFfmpeg(`${BGRA} -s ${w}x${h} -i - -y ${TRUNC} "${output}"`, exitCb);

  frameFunc(w, h, g);

  proc.stdin.end(canvas.toBuffer('raw'));
}

function editImage(input, output, frameFunc, exitCb = O.nop){
  input = formatFileName(input);
  output = formatFileName(output);

  getMediaParams(input, (w, h) => {
    var canvas = createCanvas(w, h);
    var g = canvas.getContext('2d');
    var buffLen = w * h << 2;
    var buff = Buffer.alloc(0);

    var proc1 = spawnFfmpeg(`-i "${input}" ${RGBA} -`);
    var proc2 = spawnFfmpeg(`${BGRA} -s ${w}x${h} -i - -y ${TRUNC} "${output}"`, exitCb);

    proc1.stdout.on('data', data => {
      buff = Buffer.concat([buff, data]);

      if(buff.length == buffLen){
        putBuffer(g, buff);
        frameFunc(w, h, g, proc2.stdout);

        proc2.stdin.end(canvas.toBuffer('raw'));
      }
    });
  });
}

function renderVideo(output, w, h, fps, hd, frameFunc, exitCb = O.nop){
  output = formatFileName(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');
  var f = 0;

  var proc = spawnFfmpeg(`${BGRA} -s ${w}x${h} -framerate ${fps} -i - -y -pix_fmt yuv420p -framerate ${fps} ${
    hd ? HD_PRESET : ``
  } ${TRUNC} "${output}"`, exitCb);

  frame();

  function frame(){
    var notFinished = frameFunc(w, h, g, ++f);

    if(notFinished === null){
      f--;
      setTimeout(frame);
      return;
    }

    var buff = canvas.toBuffer('raw');

    if(notFinished) proc.stdin.write(buff, frame);
    else proc.stdin.end(buff);
  }
}

function editVideo(input, output, w2, h2, fps, hd, frameFunc, exitCb = O.nop){
  input = formatFileName(input);
  output = formatFileName(output);

  getMediaParams(input, (w1, h1, framesNum) => {
    var g1 = createCanvas(w1, h1).getContext('2d');
    var g2 = createCanvas(w2, h2).getContext('2d');
    var buffLen = w1 * h1 << 2;
    var buff = Buffer.alloc(0);
    var f = 0;

    var proc1 = spawnFfmpeg(`-i "${input}" ${RGBA} -r ${fps} -`);
    var proc2 = spawnFfmpeg(`${BGRA} -s ${w2}x${h2} -framerate ${fps} -i - -y -pix_fmt yuv420p -framerate ${fps} ${
      hd ? HD_PRESET : ``
    } ${TRUNC} "${output}"`, exitCb);

    proc1.stdout.on('data', data => {
      var b = null;

      buff = Buffer.concat([buff, data]);

      if(buff.length > buffLen){
        b = buff.slice(buffLen);
        buff = buff.slice(0, buffLen);
      }

      if(buff.length == buffLen){
        proc1.stdout.pause();
        
        putBuffer(g1, buff);
        buff = Buffer.alloc(0);
        frameFunc(w1, h1, w2, h2, g1, g2, ++f, framesNum, proc2.stdout);

        proc2.stdin.write(g2.canvas.toBuffer('raw'), () => proc1.stdout.resume());
      }

      if(b !== null) buff = b;
    });

    proc1.stdout.on('end', () => {
      proc2.stdin.end();
    });
  });
}

function renderAudio(output, w, func, exitCb = O.nop){
  output = formatFileName(output);

  var buffLen = w << 2;
  var f = 0;

  var proc = spawnFfmpeg(`-f f32le -ar ${w} -ac 1 -i - -y -b:a 128k "${output}"`, exitCb);

  frame();

  function frame(){
    var buff = Buffer.alloc(buffLen);
    var notFinished = func(w, buff, ++f);

    if(notFinished === null){
      f--;
      setTimeout(frame);
      return;
    }

    if(notFinished) proc.stdin.write(buff, frame);
    else proc.stdin.end(buff);
  }
}

function custom(inputArgs, outputArgs, output, func, exitCb = O.nop){
  output = formatFileName(output);

  var f = 0;
  var proc = spawnFfmpeg(`${inputArgs} -i - -y ${outputArgs} "${output}"`, exitCb);

  frame();

  function frame(){
    var buff = func(++f);

    if(buff) proc.stdin.write(buff, frame);
    else proc.stdin.end();
  }
}

function blurRegion(g, x, y, w, h, r = 5){
  blur(g, x, y, w, h, r);
  blur(g, x, y, w, h, r);
}

function blur(g, xx, yy, w, h, r){
  var imgd = g.getImageData(xx, yy, w, h);
  var data = imgd.data;
  var buff = Buffer.alloc(w * h << 2);

  var x, y;
  var i, j;
  var index, num;
  var sum = [0, 0, 0];

  for(y = 0; y < h; y++){
    for(x = 0; x < w; x++){
      num = 0;
      sum[0] = sum[1] = sum[2] = 0;

      for(j = y - r; j <= y + r; j++){
        for(i = x - r; i <= x + r; i++){
          if(i >= 0 && i < w && j >= 0 && j < h){
            index = i + j * w << 2;

            sum[0] += data[index];
            sum[1] += data[index + 1];
            sum[2] += data[index + 2];

            num++;
          }
        }
      }

      index = x + y * w << 2;

      buff[index] = sum[0] / num + .5;
      buff[index + 1] = sum[1] / num + .5;
      buff[index + 2] = sum[2] / num + .5;
    }
  }

  for(i = 0; i < buff.length; i += 4){
    data[i] = buff[i];
    data[i + 1] = buff[i + 1];
    data[i + 2] = buff[i + 2];
  }

  g.putImageData(imgd, xx, yy);
}

function putBuffer(g, buff){
  var w = g.canvas.width;
  var h = g.canvas.height;
  var buffLen = w * h << 2;

  var imgd = g.getImageData(0, 0, w, h);
  var data = imgd.data;

  for(var i = 0; i < buffLen; i++) imgd.data[i] = buff[i];

  g.putImageData(imgd, 0, 0);
}

function spawnFfmpeg(args, exitCb = O.nop){
  return spawnProc('ffmpeg', args, exitCb);
}

function getMediaParams(mediaFile, cb){
  var proc = spawnProc('ffprobe', `-v quiet -print_format json -show_format -show_streams -i "${mediaFile}"`);
  var json = '';

  proc.stdout.on('data', a => json += a);

  proc.stdout.on('end', () => {
    var obj = JSON.parse(json);
    var s = obj.streams[0];

    cb(s.width, s.height, s.nb_frames);
  });
}

function spawnProc(name, args, exitCb = O.nop){
  name = path.join(FFMPEG_DIR, name);
  procsNum++;

  var proc = cp.spawn(name, [
    '-hide_banner',
    ...args.match(/"[^"]*"|\S+/g).map(a => a[0] == '"' ? a.substring(1, a.length - 1) : a)
  ]);

  proc.stderr.on('data', O.nop);
  proc.on('exit', () => onProcExit(exitCb));

  return proc;
}

function onProcExit(exitCb = O.nop){
  procsNum--;

  if(exitCb !== null) tryToCallExitCb();

  function tryToCallExitCb(){
    if(procsNum){
      setTimeout(tryToCallExitCb);
      return;
    }

    exitCb();
  }
}

function createCanvas(w, h){
  var g = new Canvas(w, h).getContext('2d');

  g.fillStyle = 'black';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'white';

  return g.canvas;
}

function createContext(w, h){
  return createCanvas(w, h).getContext('2d');
}