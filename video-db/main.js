'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const http = require('http');
const O = require('../omikron');
const config = require('../config');
const DB = require('./db');

const PORT = 12345;

const file = 'D:/Data/db/videos.txt';
const cwd = __dirname;

const server = http.createServer(onReq);
const db = new DB();

var sigint = 0;

setTimeout(main);

function main(){
  if(!fs.existsSync(file))
    fs.writeFileSync(file, '');

  aels();
  server.listen(PORT);

  db.load(file);
}

function aels(){
  O.proc.on('sigint', onSigint);
}

async function onReq(req, res){
  if(req.method !== 'POST') return err('Request\'s method must be POST');

  var data = await getReqData(req);
  log(String(data));

  try{ var json = JSON.parse(String(data)); }
  catch(error){ return err(error.message); }

  if(typeof json !== 'object') return err('JSON value must be an object');
  if(json === null) return err('JSON value can\'t be null');

  processData(json)
    .then(send)
    .catch(err);

  function err(msg){
    log(msg);
    send(msg, 0);
  }

  function send(data, ok=1){
    var obj;
    if(ok) obj = {data, err: null};
    else obj = {data: null, err: data};

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(obj));
  }
}

function onSigint(){
  if(sigint) return;
  sigint = 1;

  server.close();
  db.save(file);
}

function getReqData(req){
  return new Promise(res => {
    var buffs = [];

    req.on('data', buff => buffs.push(buff));
    req.on('end', () => res(Buffer.concat(buffs)));
  });
}

async function processData(data){
  var {type} = data;

  if(typeof type !== 'string')
    throw `Message type must be a string. Got "${typeof type}"`;

  switch(data.type){
    case 'has':
      return db.has(data.vid);
      break;

    case 'add':
      db.add(data.vid);
      return 'ok';
      break;

    case 'download':
      const jsDir = path.join(cwd, '..');
      const args = `/d /s /c "start /min cmd /c "cls&d&p&e "${data.url}"""`;

      const proc = cp.spawn('cmd', [args], {
        cwd: jsDir,
        stdio: 'ignore',
        windowsVerbatimArguments: true,
        detached: true,
      });

      proc.unref();
      break;
  }
}