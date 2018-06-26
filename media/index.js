'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var {Canvas} = require('../canvas');
var O = require('../framework');
var logStatus = require('../log-status');
var formatFileName = require('../format-file-name');

const DEBUG = 0;

const FFMPEG_DIR = 'C:/Program Files/Ffmpeg/bin/original';

const BGRA = '-f rawvideo -pix_fmt bgra';
const RGBA = '-f rawvideo -pix_fmt rgba';
const TRUNC = '-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"';

const VIDEO_PRESET = '-preset slow -profile:v high -crf 18 -coder 1 -pix_fmt yuv420p -movflags +faststart -bf 2 -c:a aac -b:a 384k -profile:a aac_low';
const FAST_PRESET = `-c:v ${'h264_nvenc'} ${VIDEO_PRESET}`;
const HD_PRESET = `-c:v ${'libx264'} ${VIDEO_PRESET}`;

var fd = process.stdout.fd;

var procs = [];
var tempDir = null;

addEventListeners();

module.exports = {
  renderImage,
  editImage,
  renderVideo,
  editVideo,
  renderAudio,
  presentation,
  custom,
  buff2canvas,
  spawnFfmpeg,
  blurRegion,
  createCanvas,
  createContext,
  logStatus,
  Canvas,
};

function renderImage(output, w, h, frameFunc=O.nop, exitCb=O.nop){
  output = formatFileName(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');

  var proc = spawnFfmpeg(`${BGRA} -s ${w}x${h} -i - -y ${TRUNC} "${output}"`, exitCb);

  frameFunc(w, h, g);

  proc.stdin.end(canvas.toBuffer('raw'));
}

function editImage(input, output, frameFunc=O.nop, exitCb=O.nop){
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

function renderVideo(output, w, h, fps, fast, frameFunc=O.nop, exitCb=O.nop){
  output = formatFileName(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');
  var f = 0;

  var proc = spawnFfmpeg(`${BGRA} -s ${w}x${h} -framerate ${fps} -i - -y -framerate ${fps} ${
    fast ? FAST_PRESET : HD_PRESET
  } ${TRUNC} "${output}"`, exitCb);

  frame();

  function frame(){
    var value = frameFunc(w, h, g, ++f);
    var buff;

    if(value instanceof Buffer){
      buff = value;
    }else if(value === null){
      f--;
      setTimeout(frame);
      return;
    }else{
      buff = canvas.toBuffer('raw');
    }

    if(value) proc.stdin.write(buff, frame);
    else proc.stdin.end(buff);
  }
}

function editVideo(input, output, w2, h2, fps, fast, frameFunc=O.nop, exitCb=O.nop){
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
      fast ? FAST_PRESET : HD_PRESET
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

    proc1.on('exit', status => {
      proc2.stdin.end();
    });
  });
}

function renderAudio(output, w, func, exitCb=O.nop){
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

function presentation(output, w, h, fps, fast, exitCb=O.nop){
  output = formatFileName(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');
  var f = 0;

  var proc = spawnFfmpeg(`${BGRA} -s ${w}x${h} -framerate ${fps} -i - -y -framerate ${fps} ${
    fast ? FAST_PRESET : HD_PRESET
  } ${TRUNC} "${output}"`, exitCb);

  frame.g = g;
  frame.f = 1;

  return frame;

  async function frame(value){
    var buff;

    if(value instanceof Buffer){
      buff = value;
    }else if(value === true){
      buff = canvas.toBuffer('raw');
    }

    await new Promise(res => {
      var r = () => {
        frame.f++;
        res();
      };

      if(value){
        proc.stdin.write(buff, r);
      }else{
        proc.stdin.end(buff, r);
      }
    });
  }
}

function custom(inputArgs, input, outputArgs, output, func=O.nop, exitCb=O.nop){
  output = formatFileName(output);

  var f = 0;
  var proc = spawnFfmpeg(`${inputArgs} -i "${input}" -y ${outputArgs} "${output}"`, exitCb);

  frame();

  function frame(){
    var buff = func(++f);

    if(buff) proc.stdin.write(buff, frame);
    else proc.stdin.end();
  }
}

function buff2canvas(buff, cb=O.nop){
  var tempDir = getTempDir();
  var tempFile = path.join(tempDir, '1');

  fs.writeFileSync(tempFile, buff);

  var ffprobe = getMediaParams(tempFile, (w, h) => {
    if(w === null)
      return err(h);

    var proc = spawnFfmpeg(`-i "${tempFile}" -f rawvideo -pix_fmt rgba -vframes 1 -`);
    var g = createContext(w, h);
    var imgd = g.createImageData(w, h);
    var data = imgd.data;
    var i = 0;

    proc.stdout.on('data', chunk => {
      var len = chunk.length;

      for(var j = 0; j !== len; j++)
        data[i++ | 0] = chunk[j | 0] | 0;
    });

    proc.on('exit', status => {
      if(status !== 0)
        return err(status);

      g.putImageData(imgd, 0, 0);
      
      cb(g.canvas);
    });

    proc.stdin.on('error', O.nop);
    proc.stdin.end(buff);
  });

  ffprobe.stdin.on('error', O.nop);
  ffprobe.stdin.end(buff);

  function err(status){
    cb(null, new Error(`The process exited with code ${status}`));
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

function spawnFfmpeg(args, exitCb=O.nop){
  return spawnProc('ffmpeg', args, exitCb);
}

function getMediaParams(mediaFile, cb){
  var proc = spawnProc('ffprobe', `-v quiet -print_format json -show_format -show_streams -i "${mediaFile}"`);
  var data = Buffer.alloc(0);

  proc.stdout.on('data', chunk => {
    data = Buffer.concat([data, chunk]);
  });

  proc.on('exit', status => {
    if(status !== 0)
      return cb(null, status);

    var str = data.toString('utf8');

    try{
      var obj = JSON.parse(str);
      var s = obj.streams[0];

      cb(s.width, s.height, s.nb_frames);
    }catch(e){
      cb(null);
    }
  });

  return proc;
}

function spawnProc(name, args, exitCb=O.nop){
  name = path.join(FFMPEG_DIR, name);

  var args = [
    '-hide_banner',
    ...args.match(/"[^"]*"|\S+/g).map(a => a[0] == '"' ? a.substring(1, a.length - 1) : a)
  ];

  if(DEBUG){
    var border = '='.repeat(70);
    var argsStr = args.slice(1).map(arg => arg.includes(' ') ? `"${arg}"` : arg).join(' ');
    var strName = name.match(/([a-z]+)$/)[1];
    var str = `\n${border}\n${strName} ${argsStr}\n${border}\n`;

    log(str);
  }

  var proc = cp.spawn(name, args);

  procs.push(proc);

  proc.stderr.on('data', DEBUG ? onStderrData : O.nop);
  proc.on('exit', () => onProcExit(proc, exitCb));

  return proc;
}

function onProcExit(proc, exitCb=O.nop){
  var index = procs.indexOf(proc);
  procs.splice(index, 1);

  if(exitCb !== null)
    tryToCallExitCb();

  function tryToCallExitCb(){
    if(procs.length !== 0){
      setTimeout(tryToCallExitCb);
      return;
    }

    exitCb();
  }
}

function onStderrData(data){
  process.stdout.write(data);
}

function createCanvas(w, h){
  var g = new Canvas(w, h).getContext('2d');

  g.fillStyle = 'black';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'white';

  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.font = '32px arial';

  return g.canvas;
}

function createContext(w, h){
  return createCanvas(w, h).getContext('2d');
}

function addEventListeners(){
  process.on('SIGINT', () => {
    closeProcs();
  });

  process.on('uncaughtException', err => {
    log(err.stack);
    closeProcs();
  });
}

function closeProcs(){
  procs.forEach(proc => {
    try{
      proc.stdin.end();
    }catch(e){}
  });

  setInterval(() => {
    if(procs.length === 0)
      process.exit();
  });
}

function getTempDir(){
  if(tempDir === null)
    tempDir = require('../temp-dir')(__filename);

  return tempDir;
}

function log(str){
  fs.writeFileSync(fd, `${str}\n`);
}