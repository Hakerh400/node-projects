'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

setTimeout(() => main().catch(err));

async function main(){
  const dir1 = path.join(O.dirs.dw, 'input');
  const dir2 = path.join(O.dirs.dw, 'output');
  const files = fs.readdirSync(dir1);

  for(const file of files){
    log(file);
    await pf(path.join(dir1, file), path.join(dir2, file).replace(/\.[^\.]+$/, '.png'));
  }

  exit();
}

function pf(file1, file2){
  return new Promise(res => {
    media.editImage(file1, file2, (w, h, g) => {
      g.fillStyle = new O.Color(128, 128, 128);

      const dx = Math.ceil(w * .08);
      const dy = Math.ceil(h * .08);

      g.fillRect(0, 0, dx, dy);
      g.fillRect(w - dx, 0, dx+1, dy);
      g.fillRect(0, h - dy, dx, dy+1);
      g.fillRect(w-dx, h - dy, dx+1, dy+1);
    }, res);
  });
}

function err(err){
  log(err.message);
  exit();
}

function exit(){
  setTimeout(() => window.close(), 100);
}