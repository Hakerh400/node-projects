'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const {Canvas} = require('../canvas');
const O = require('../framework');
const logStatus = require('../log-status');
const formatFileName = require('../format-file-name');

const DEBUG = 0;

const FFMPEG_DIR = 'C:/Program Files/Ffmpeg/bin/original';

const BGRA = '-f rawvideo -pix_fmt bgra';
const RGBA = '-f rawvideo -pix_fmt rgba';
const TRUNC = '-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2"';

const VIDEO_PRESET = '-preset slow -profile:v high -crf 18 -coder 1 -pix_fmt yuv420p -movflags +faststart -bf 2 -c:a aac -b:a 384k -profile:a aac_low';
const FAST_PRESET = `-c:v ${'h264_nvenc'} ${VIDEO_PRESET}`;
const HD_PRESET = `-c:v ${'libx264'} ${VIDEO_PRESET}`;

const flags = {
  verbose: 1,
};

const fd = process.stdout.fd;

var procs = [];
var tempDir = null;
var shouldExit = 0;

addEventListeners();

module.exports = {
  Canvas,
  flags,


  createCanvas,
  createContext,
  logStatus,
  loadImage,

  renderImage,
  editImage,

  renderVideo,
  editVideo,

  renderAudio,

  presentation,
  custom,

  buff2canvas,
  spawnFfmpeg,

  blur,
  fill,
};

const conv = require('../color-converter');

function addEventListeners(){
  process.on('uncaughtException', onError);
  process.on('SIGINT', O.nop);
}

function onStdinData(data){
  if(shouldExit) return;

  if(data.includes(0x03))
    onSigint();
}

function onError(err){
  if(err instanceof Error) err = err.stack;
  log(err);
  closeProcs();
}

function onSigint(){
  closeProcs();
}

function loadImage(input){
  return new Promise(res => {
    var img;

    editImage(input, '-', (w, h, g) => {
      img = g;
    }, () => {
      res(img);
    });
  });
}

function renderImage(output, w, h, frameFunc=O.nop, exitCb=O.nop){
  output = formatFileName(output);

  var canvas = createCanvas(w, h);
  var g = canvas.getContext('2d');

  var proc = spawnFfmpeg(`${BGRA} -s ${w}x${h} -i - -y ${TRUNC} "${output}"`, exitCb);

  frameFunc(w, h, g);

  end(proc, canvas.toBuffer('raw'));
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

        end(proc2, canvas.toBuffer('raw'));
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

    if(value) write(proc, buff, frame);
    else end(proc, buff);
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

        write(proc2, g2.canvas.toBuffer('raw'), () => proc1.stdout.resume());
      }

      if(b !== null) buff = b;
    });

    proc1.on('exit', status => {
      end(proc2);
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

    if(notFinished) write(proc, buff, frame);
    else end(proc, buff);
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
        write(proc, buff, r);
      }else{
        end(proc, buff, r);
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

    if(buff) write(proc, buff, frame);
    else end(proc);
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
    end(proc, buff);
  });

  ffprobe.stdin.on('error', O.nop);
  end(ffprobe, buff);

  function err(status){
    cb(null, new Error(`The process exited with code ${status}`));
  }
}

function blur(g, x, y, w, h, r = 5){
  blurRegion(g, x, y, w, h, r);
  blurRegion(g, x, y, w, h, r);
}

function blurRegion(g, xx, yy, w, h, r){
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

function fill(g, x, y){
  var {width: w, height: h} = g.canvas;

  var imgd = g.getImageData(0, 0, w, h);
  var data = imgd.data;

  var col = Buffer.from(conv.col2rgb(g.fillStyle));

  var i = getI(x, y);
  var colPrev = Buffer.alloc(3);

  colPrev[0] = data[i];
  colPrev[1] = data[i + 1];
  colPrev[2] = data[i + 2];

  if(col.equals(colPrev)) return 0;

  var queue = [x, y];

  while(queue.length !== 0){
    x = queue.shift(), y = queue.shift();
    if(!isPrev(x, y)) continue;

    var i = getI(x, y);

    data[i] = col[0];
    data[i + 1] = col[1];
    data[i + 2] = col[2];

    add(x, y - 1);
    add(x + 1, y);
    add(x, y + 1);
    add(x - 1, y);
  }

  g.putImageData(imgd, 0, 0);
  
  return 1;

  function add(x, y){
    if(!(isIn(x, y) && isPrev(x, y))) return;
    queue.push(x, y);
  }

  function isPrev(x, y){
    var i = getI(x, y);

    return data[i] === colPrev[0] &&
           data[i + 1] === colPrev[1] &&
           data[i + 2] === colPrev[2];
  }
  
  function isIn(x, y){
    return x >= 0 && y >= 0 && x < w && y < h;
  }

  function getI(x, y){
    return x + y * w << 2;
  }
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

  if(procs.length === 1)
    process.stdin.on('data', onStdinData);

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

    process.stdin.removeListener('data', onStdinData);
    process.stdin.unref();

    if(flags.verbose) log('P0');

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
  g.font = '32px "Arial"';

  return g.canvas;
}

function createContext(w, h){
  return createCanvas(w, h).getContext('2d');
}

function closeProcs(){
  shouldExit = 1;

  procs.forEach(proc => {
    try{
      proc.stdin.end();
    }catch{}
  });
}

function write(proc, buff, cb){
  if(shouldExit) return;
  proc.stdin.write(buff, cb);
}

function end(proc, buff, cb){
  if(shouldExit) return;
  proc.stdin.end(buff, cb);
}

function getTempDir(){
  if(tempDir === null)
    tempDir = require('../temp-dir')(__filename);

  return tempDir;
}