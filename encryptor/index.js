'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var media = require('../media');
var encryptor = require('./encryptor');

var attemptsNum = 10;

var hexFile = '1.hex';
var imgFile = '1.png';

module.exports = {
  compress,
  decompress,
  encrypt,
  decrypt,
};

function compress(input, output, password = '', cb = O.nop){
  var fsStream = fs.createWriteStream(path.join(output, hexFile));
  var hashStream = new encryptor.createHashStream(password);
  var gzip = zlib.createGzip();

  gzip.pipe(hashStream);
  hashStream.pipe(fsStream);

  fsStream.on('close', () => cb());

  fsRec.processFiles(input, obj => {
    if(obj.processed) return;

    writeByte(obj.isDir);
    writeStr(obj.name);

    if(obj.isDir){
      writeInt(fs.readdirSync(obj.fullPath).length);
    }else{
      var content = fs.readFileSync(obj.fullPath);

      writeInt(content.length);
      gzip.write(content);
    }
  }, () => {
    gzip.end();
  });

  function writeByte(val){
    gzip.write(Buffer.from([val]));
  }

  function writeInt(val){
    var buff = Buffer.alloc(4);
    buff.writeInt32LE(val | 0);
    gzip.write(buff);
  }

  function writeStr(str){
    writeInt(str.length);
    gzip.write(Buffer.from(`${str}`));
  }
}

function decompress(input, output, password = '', cb = O.nop){
  var fsStream = fs.createReadStream(path.join(input, hexFile));
  var hashStream = new encryptor.createHashStream(password);
  var gunzip = zlib.createGunzip();

  fsStream.pipe(hashStream);
  hashStream.pipe(gunzip);

  gunzip.on('error', err => cb(err));

  var currentDir = output;
  var buffs = [];
  var buff = null;
  var index = 0;

  gunzip.on('data', data => buffs.push(data));
  gunzip.on('close', () => processData());

  function processData(){
    buff = Buffer.concat(buffs);

    var filesNum = [1];

    while(filesNum.length){
      var elem = parseElem();

      if(elem.isDir){
        currentDir = path.join(currentDir, elem.name);
        fs.mkdirSync(currentDir);

        if(elem.filesNum){
          filesNum.push(elem.filesNum);
        }else{
          decFilesNum();
        }
      }else{
        fs.writeFileSync(path.join(currentDir, elem.name), elem.content);

        decFilesNum();
      }
    }

    cb(null);

    function decFilesNum(){
      while(filesNum.length && filesNum[filesNum.length - 1] == 1){
        currentDir = path.join(currentDir, '..');
        filesNum.pop();
      }

      if(filesNum.length) filesNum[filesNum.length - 1]--;
    }
  }

  function parseElem(){
    var isDir = !!readByte();
    var name = readStr();
    var filesNum = null;
    var content = null;

    if(isDir) filesNum = readInt();
    else content = readData();

    return new Element(path.join(currentDir, name), name, isDir, filesNum, content);
  }

  class Element{
    constructor(fullPath, name, isDir, filesNum = null, content = null){
      this.fullPath = fullPath;
      this.name = name;
      this.isDir = isDir;
      this.filesNum = filesNum;
      this.content = content;
    }
  };

  function readByte(){
    return buff[index++];
  }

  function readInt(){
    var val = buff.readInt32LE(index);
    index += 4;
    return val;
  }

  function readStr(){
    return readData().toString();
  }

  function readData(len = null){
    if(len === null) len = readInt();
    return Buffer.from(buff.slice(index, index += len));
  }
}

function encrypt(input, output, password = '', cb = O.nop){
  compress(input, output, password, () => {
    var hex = path.join(output, hexFile);
    var img = path.join(output, imgFile);
    var data = fs.readFileSync(hex);

    var len = data.length;
    var size = Math.ceil((len / 3) ** .5);
    if(size & 1) size++;

    var targetLen = size ** 2 * 3;
    var diffLen = targetLen - len;
    var buff = Buffer.concat([data, Buffer.alloc(diffLen)]);

    media.renderImage(img, size, size, (w, h, g) => {
      var imgd = g.getImageData(0, 0, w, h);
      var data = imgd.data;
      var index = 0;

      data.forEach((byte, i) => data[i] = (i & 3) < 3 ? buff[index++] : 255);

      g.putImageData(imgd, 0, 0);
    }, () => cb());
  });
}

function decrypt(input, output, password = '', cb = O.nop){
  var hex = path.join(input, hexFile);
  var img = path.join(input, imgFile);

  media.editImage(img, '-', (w, h, g) => {
    var imgd = g.getImageData(0, 0, w, h);
    var data = imgd.data;
    var index = 0;

    var buff = Buffer.alloc(w * h * 3);
    data.forEach((byte, i) => (i & 3) < 3 && (buff[index++] = byte));

    index = buff.length;
    while(!buff[index--]);
    index += 2;

    buff = Buffer.from(buff.slice(0, index));
    fs.writeFileSync(hex, buff);

    var attemptNum = 0;
    attempt(true);

    function attempt(err){
      if(err){
        if(attemptNum++ == attemptsNum) return cb(err);
        return decompress(input, output, password, attempt);
      }

      cb();
    }
  });
}