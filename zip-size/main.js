'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const O = require('../omikron');
const hash = require('../hash');

const fileName = '_';

setTimeout(() => main().catch(log));

async function main(){
  O.enhanceRNG();

  const args = process.argv.slice(2);

  if(args.length !== 2)
    throw new TypeError('Expected exactly 2 arguments');

  const dir = path.normalize(args[0]);
  const size = parseSize(args[1]);

  if(!fs.existsSync(dir))
    throw new TypeError('The specified directory doesn\'t exist');
  if(!fs.statSync(dir).isDirectory())
    throw new TypeError('The specified path doesn\'t represent a directory');

  const dirName = path.parse(dir).name;
  const zipName = `${dirName}.zip`;
  const file = path.join(dir, fileName);
  const zipFile = path.join(dir, '..', zipName);

  let fileSize = 1;

  while(1){
    const buf = randBuf(fileSize);
    fs.writeFileSync(file, buf);
    await zipFiles(dir, zipFile);

    const actualSize = fs.statSync(zipFile).size;
    log((actualSize / size).toFixed(9));
    if(actualSize === size) break;

    fileSize = fileSize / actualSize * size + .5 | 0;
    fileSize += O.rand(-5, 5);
  }

  fs.unlinkSync(file);
}

function zipFiles(dir, zipFile){
  return new Promise((res, rej) => {
    const stream = fs.createWriteStream(zipFile);
    const archive = archiver('zip');

    archive.pipe(stream);

    stream.on('close', res);
    archive.on('error', rej);

    archive.directory(dir, false);
    archive.finalize();
  });
}

function parseSize(str){
  if(!/^\d+(?:[kmg]?b)?$/i.test(str))
    throw new TypeError('Invalid size format');

  let size = +str.match(/\d+/)[0];
  let type = str.match(/\D*$/)[0].toLowerCase();

  if(type.length === 2)
    size *= 1024 ** ('kmg'.indexOf(type[0]) + 1);

  return size;
}

function randBuf(size){
  const len = Math.ceil(size / 64);
  const arr = [];

  let h = hash(O.ca(4, () => O.randf()).join(','));

  const nb = Buffer.alloc(4);
  const hnb = [h, nb];

  for(let i = 0; i !== len; i++){
    nb.writeInt32LE(O.rand(2 ** 32));
    h = hnb[0] = hash(Buffer.concat(hnb));
    arr.push(h);
  }

  let buf = Buffer.concat(arr);
  if(buf.size !== size)
    buf = Buffer.from(buf.slice(0, size));

  return buf;
}