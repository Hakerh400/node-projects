'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const readline = require('readline');
const O = require('../framework');

const ytDow = require('.');
const Video = require('./video');

const PORT = 27000;

const videoDir = path.normalize('D:/Videos');
const audioDir = path.normalize('D:/Music');

const modes = O.enum([
  'AUDIO',
  'VIDEO',
  'ALL',
]);

const modeAliases = initModeAliases([
  ['audio', 'a', 'm'],
  ['video', 'v'],
  ['all', '*'],
]);

const stats = O.enum([
  'NOT_QUEUED',
  'DOWNLOADING',
  'DOWNLOADED',
]);

var subDirName = '.';
var mode = modes.AUDIO;

var mainDir = null;
var subDir = null;

var downloading = null;

var server = http.createServer(onReq).listen(PORT);
var rl = readline.createInterface(process.stdin, process.stdout);

setTimeout(main);

function main(){
  updateMainDir();

  ask();
}

function initModeAliases(aliases){
  var obj = O.obj();

  aliases.forEach((arr, index) => {
    arr.forEach(alias => {
      obj[alias] = index;
    });
  });

  return obj;
}

function ask(){
  rl.question('>', async str => {
    var result = await onInput(str);
    if(result) log('');
    ask();
  });
}

async function onInput(str){
  await O.while(() => downloading !== null);

  str = str.trim();
  if(str.length === 0) return 0;

  var cmds = str.split(/\s+/);
  var cmd = cmds.shift();
  var len = cmds.length;

  switch(cmd){
    case 'info':
      if(len === 0) info('mode mainDir subDir subDirName');
      else info(cmds);
      break;

    case 'dir':
      if(len !== 1) return err(1);
      if(await setSubDirName(cmds[0]))
        info('subDir subDirName');
      break;

    case 'mode':
      if(len !== 1) return err(1);
      if(await setMode(cmds[0]))
        info('mode mainDir subDir');
      break;

    case 'exit':
      if(len !== 0) return err(0);
      await exit();
      break;

    default:
      log('Unknown command');
      break;
  }

  return 1;

  function info(vars){
    if(!Array.isArray(vars))
      vars = vars.split(' ');

    vars.forEach(vari => {
      var val;

      switch(vari){
        case 'mode': val = mode2str(); break;
        case 'mainDir': val = mainDir; break;
        case 'subDir': val = subDir; break;
        case 'subDirName': val = subDirName; break;

        default:
          log(`Unknown variable "${vari}"`);
          return;
          break;
      }

      log(`${vari}: ${val}`);
    });
  }

  function err(len){
    log(`Command "${cmd}" takes ${formatStr('argument', len)}`);
    return 1;
  }
}

function onReq(req, res){
  var buffs = [];

  req.on('data', data => {
    buffs.push(data);
  })

  req.on('end', async () => {
    var data = Buffer.concat(buffs);
    data = JSON.parse(data.toString('utf8'));

    var result = await processData(data);
    res.end(JSON.stringify(result));
  });
}

async function processData(data){
  var res = O.obj();

  switch(data.type){
    case 'status':
      var video = Video.from(data);
      res.stat = await getStat(video);
      break;

    case 'download':
      var video = Video.from(data);
      res.stat = await download(video, data.urls);
      break;
  }

  return res;
}

async function getStat(video){
  if(video.eq(downloading)) return stats.DOWNLOADING
  if(video.exists(subDir)) return stats.DOWNLOADED;
  return stats.NOT_QUEUED;
}

async function download(video, urls){
  if(downloading !== null){
    if(video.eq(downloading)) return stats.DOWNLOADING;
    return stats.NOT_QUEUED;
  }

  if(!video.exists(subDir)){
    if(mode === modes.AUDIO)
      urls = urls.filter(url => url.includes('mime=audio'));
    else if(mode === modes.VIDEO)
      urls = urls.filter(url => url.includes('mime=video'));

    downloading = video;
    log(`Downloading ${video.name}`);

    await video.download(urls, subDir);

    log('Downloading finished');
    downloading = null;
  }

  return stats.DOWNLOADED;
}

function updateMainDir(){
  switch(mode){
    case modes.AUDIO: mainDir = audioDir; break;
    case modes.VIDEO: mainDir = videoDir; break;
    case modes.ALL: mainDir = videoDir; break;
  }

  updateSubDir();
}

function updateSubDir(){
  subDir = path.join(mainDir, subDirName);
}

function setSubDirName(dir){
  subDirName = path.normalize(dir);
  updateSubDir();

  return 1;
}

function setMode(m){
  var m1 = m.toLowerCase();

  if(!(m1 in modeAliases)){
    log(`Unknown mode "${m}"`);
    return;
  }

  mode = modeAliases[m1];
  updateMainDir();

  return 1;
}

function mode2str(m=mode){
  return modes.name(m);
}

async function exit(){
  process.exit();
}

function formatStr(str, num){
  if(num !== 1) str += 's';
  if(num === 0) num = 'no';
  return `${num} ${str}`;
}