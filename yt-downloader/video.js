'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const O = require('../omikron');
const fsRec = require('../fs-rec');

const exts = [
  'mp3',
  'mp4',
  'webm',
  'm4a',
];

class Video{
  constructor(id, channel, title){
    this.id = id;
    this.channel = channel;
    this.title = title;

    this.ext = null;
    this.name = null;

    this.updateName();
  }

  static from(data){
    var {id, channel, title} = data;
    return new Video(id, channel, title);
  }

  updateName(){
    var {id, channel, title} = this;

    channel = escape(channel);
    title = escape(title);

    var name = `[${channel}] ${title} [${id}]`;

    if(this.hasExt())
      name = `${name}.${this.ext}`;

    this.name = name;
  }

  async download(urls, dir){
    if(urls.length !== 1)
      throw 'modes.ALL is not supported';

    var url = urls[0];
    var ps = getUrlParams(url);

    var clen = BigInt(ps.clen);
    ps.range = `0-${clen - 1n}`;

    var ext = ps.mime.match(/\%2F(.*)/i)[1];
    this.setExt(ext);

    url = setUrlParams(url, ps);
    var file = path.join(dir, this.name);

    fsRec.createDirSync(dir);
    await saveFile(url, file);
  }

  eq(video){
    if(!(video instanceof Video)) return 0;
    return video.id === this.id;
  }

  hasExt(){
    return this.ext !== null;
  }

  setExt(ext){
    this.ext = ext;
    this.updateName();
  }

  exists(dir, allExts=0){
    var {name} = this;

    if(!allExts && this.hasExt())
      return fs.existsSync(path.join(dir, name));

    return exts.some(ext => {
      var file = `${name}.${ext}`;
      return fs.existsSync(path.join(dir, file));
    });
  }
};

module.exports = Video;

function saveFile(url, file){
  return new Promise(resolve => {
    var type = url.startsWith('https') ? https : http;

    type.get(url, res => {
      var stream = fs.createWriteStream(file);
      res.pipe(stream);

      stream.on('close', () => {
        resolve();
      });
    });
  });
}

function getUrlParams(url){
  var ps = O.obj();

  url.match(/[\?\&][^\=]+\=[^\&]*/g).forEach(pair => {
    var [name, val] = pair.substring(1).split('=');
    ps[name] = val;
  });

  return ps;
}

function setUrlParams(url, ps){
  url = url.substring(0, url.indexOf('?'));

  O.keys(ps).forEach((name, index) => {
    var val = ps[name];
    var sep = index === 0 ? '?' : '&';

    url += `${sep}${name}=${val}`;
  });

  return url;
}

function escape(str){
  str = str.split('').filter(char => {
    if(char < ' ' || char > '~') return 0;
    if('>\\/:*?"<>|\[\]'.includes(char)) return 0;
    return 1;
  }).join('');

  str = str.trim().replace(/\s+/, ' ');

  return str;
}