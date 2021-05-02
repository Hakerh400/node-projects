'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const fsRec = require('../fs-rec');

const {min, max} = Math;

const END_MIN = 135;

const ffDir = 'C:/Program Files/FFmpeg/bin/latest';

const wipStr = '[WIP]';
const fixedStr = '[FIXED]';

const args = process.argv.slice(2);

const exts = O.arr2obj([
  'mp4',
  'mkv',
  'webm',
]);

const main = () => {
  if(args.length === 0)
    O.error('Expected folder path as argument');

  const dirPth = args.join(' ');
  const dir = new fsRec.Directory(dirPth);

  dir.topDown(entry => {
    if(!entry.isFile) return;
    if(!(entry.ext in exts)) return;

    if(entry.name.endsWith(` ${wipStr}`)) return;
    if(entry.name.endsWith(` ${fixedStr}`)) return;

    const pth1 = entry.pth;
    const pth2 = entry.join(`../${entry.name} ${wipStr}.${entry.ext}`);
    const pth3 = entry.join(`../${entry.name} ${fixedStr}.${entry.ext}`);

    log(path.relative(dirPth, pth1));

    if(exists(pth2) && exists(pth3))
      del(pth3);

    if(exists(pth3)) return;

    const info = JSON.parse(fp(`-v quiet -print_format json -show_format -show_streams "${pth1}"`));
    const dur = Number(info.format.duration);
    const vid = info.streams.find(a => a['codec_type'] === 'video');
    const {width, height} = vid;

    /*
      Start:  d * 0.2 - 20
      End:    d * 0.5 + 5
      Height: h * 0.0625 + 5
    */

    const start = dur * 0.2 - 20;
    const end = max(dur * 0.5 + 5, END_MIN);
    const x = 0;
    const y = 0;
    const w = width;
    const h = height * 0.0625 + 5;

    fg(`-i "${pth1}" -c:a copy -vf "format=yuv420p,drawbox=enable='between(t,${start},${end})':x=${x}:y=${y}:w=${w}:h=${h}:color=#808080:t=fill" -max_muxing_queue_size 2048 "${pth2}"`);

    fs.renameSync(pth2, pth3);
  });
};

const fg = args => {
  return ff('ffmpeg', `-y ${args}`, {stdio: 'ignore'});
};

const fp = args => {
  return ff('ffprobe', args);
};

const ff = (prog, args, opts) => {
  return cmd(`"${path.join(ffDir, prog)}"`, `-hide_banner ${args}`, opts);
};

const cmd = (prog, args, opts={}) => {
  const result = cp.execSync(`${prog} ${args}`, opts);
  if(result === null) return null;
  if(Buffer.isBuffer(result)) return result.toString();
  return result.stdout + result.stderr;
};

const exists = pth => {
  return fs.existsSync(pth);
};

const del = pth => {
  fs.unlinkSync(pth);
};

main();