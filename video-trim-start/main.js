'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const config = require('../config');
const media = require('../media');

const args = process.argv.slice(2);

const main = () => {
  if(args.length === 0)
    error('Expected folder path as argument');

  const dir = args.join(' ');
  const files = fs.readdirSync(dir);
  const num = files.length;

  for(let i = 0; i !== num; i++){
    media.logStatus(i + 1, num, 'file');

    const file = files[i];
    const pth1 = path.join(dir, file);
    const pth2 = path.join(dir, `_${file}`);

    if(!fs.statSync(pth1).isFile())
      continue;

    const obj = cp.spawnSync(config.exe.ffmpeg, [
      '-hide_banner',
      '-y',
      '-i', pth1,
      '-c', 'copy',
      '-ss', '30',
      pth2,
    ]);

    if(obj.status !== 0)
      error(obj.stderr.toString());

    fs.unlinkSync(pth1);
    fs.renameSync(pth2, pth1);
  }
};

const error = err => {
  process.exitCode = 1;
  O.exit(err);
};

main();