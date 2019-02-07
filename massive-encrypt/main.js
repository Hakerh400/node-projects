'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const O = require('../omikron');
const readline = require('../readline');
const fsRec = require('../fs-rec');

O.enhanceRNG();

const dataFile = '_';

const rl = readline.createInterface(process.stdin, process.stdout);

setTimeout(() => main().catch(log));

async function main(){
  O.proc.on('sigint', () => {
    log();
    log('Terminating');
    O.proc.exit();
  });

  let mode = await ask('Encrypt or decrypt [e/d]');
  mode = mode.toLowerCase();

  if('encrypt'.startsWith(mode)) mode = 0;
  else if('decrypt'.startsWith(mode)) mode = 1;
  else err('Unrecognized mode');

  const checkDir = dir => {
    const msg = 'The path provided';

    if(!fs.existsSync(dir)) err(`${msg} doesn't exist`);
    if(!fs.statSync(dir).isDirectory()) err(`${msg} is not a directory`);
  }

  let input = await ask('Input directory');
  checkDir(input);
  input = path.normalize(input);

  let output = await ask('Output directory');
  checkDir(output);
  if(fs.readdirSync(output).length !== 0) err('Output directory is not empty');
  output = path.normalize(output);

  let pass = await ask('Password');
  pass = O.sha256(pass);

  rl.close();

  log();
  if(mode === 0) await encrypt(input, output, pass);
  else await decrypt(input, output, pass);

  log();
  log('Finished');
}

async function encrypt(input, output, pass){
  const ser = new O.Serializer();
  const map = O.obj();
  const queue = [input];

  while(queue.length !== 0){
    const p = queue.shift();
    const names = fs.readdirSync(p);

    ser.writeInt(names.length);

    names.forEach((name, index) => {
      const entry = path.join(p, name);
      const stat = fs.statSync(entry);

      let obj = map;
      for(const dir of path.relative(input, entry).split(/[\/\\]/)){
        if(!(dir in obj)) obj[dir] = [index, O.obj()];
        obj = obj[dir][1];
      }

      ser.writeStr(name);

      if(stat.isFile()){
        ser.write(0);
      }else if(stat.isDirectory()){
        ser.write(1);
        queue.push(entry);
      }else{
        err(`Unrecognized file system entry ${JSON.stringify(entry)}`);
      }
    });
  }

  ser.writeBuf(O.randBuf(O.randInt(64, .9)));
  const data = ser.getOutput(1);
  O.IO.xor(data, O.sha256(pass), 1);
  fs.writeFileSync(path.join(output, dataFile), data);

  await fsRec.processFilesSync(input, async d => {
    if(d.processed || d.depth === 0) return;

    const ser = new O.Serializer();
    const rel = d.relativeSubPath;

    let obj = map;
    let out = output;

    for(const dir of rel.split(/[\/\\]/)){
      ser.write(1);
      ser.writeInt(obj[dir][0]);

      out = path.join(out, String(obj[dir][0]));
      obj = obj[dir][1];
    }

    if(d.isDir){
      fs.mkdirSync(out);
      return;
    }

    logFile(rel);
    const seed = Buffer.concat([pass, ser.getOutput()]);
    await xorFile(d.fullPath, out, seed);
  });
}

async function decrypt(input, output, pass){
  const data = fs.readFileSync(path.join(input, dataFile));
  O.IO.xor(data, O.sha256(pass), 1);

  let ser;
  try{ ser = new O.Serializer(data, 1); }
  catch{ err('Wrong password'); }

  const map = O.obj();
  const queue = [output, map];

  while(queue.length !== 0){
    const p = queue.shift();
    const obj = queue.shift();

    const len = ser.readInt();

    for(let index = 0; index !== len; index++){
      const name = ser.readStr();
      const isDir = ser.read();

      if(!isDir){
        obj[index] = [name];
      }else{
        obj[index] = [name, O.obj()];
        queue.push(path.join(output, name), obj[index][1]);
      }
    }
  }

  await fsRec.processFilesSync(input, async d => {
    if(d.processed || d.depth === 0) return;
    if(d.name === dataFile) return;

    const ser = new O.Serializer();
    const rel = d.relativeSubPath;

    let obj = map;
    let out = output;

    for(const dir of rel.split(/[\/\\]/)){
      ser.write(1);
      ser.writeInt(dir | 0);

      out = path.join(out, String(obj[dir][0]));
      obj = obj[dir][1];
    }

    if(d.isDir){
      fs.mkdirSync(out);
      return;
    }

    logFile(path.relative(output, out));
    const seed = Buffer.concat([pass, ser.getOutput()]);
    await xorFile(d.fullPath, out, seed);
  });
}

function xorFile(input, output, pass){
  return new Promise(res => {
    let hash = O.sha256(pass);
    let index = 0;

    const read = fs.createReadStream(input);
    const write = fs.createWriteStream(output);

    const xor = new stream.Transform({
      transform(buf, enc, cb){
        const len = buf.length;

        for(let i = 0; i !== len; i++){
          buf[i] ^= hash[index++];

          if(index === 32){
            hash = O.sha256(hash);
            index = 0;
          }
        }

        cb(null, buf);
      },
    });

    read.pipe(xor).pipe(write);
    write.on('close', res);
  });
}

async function ask(prompt){
  let answer;

  while(1){
    answer = await ask();
    if(answer !== '') break;
    log('Input cannot be empty');
  }

  return answer;

  function ask(){
    return new Promise(res => {
      rl.question(`${prompt}: `, answer => {
        res(answer);
      });
    });
  }
}

function logFile(file){
  log(file);
}

function err(msg){
  log(`ERROR: ${msg}`);
  O.proc.exit();
}