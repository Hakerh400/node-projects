'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const O = require('../omikron');

setTimeout(() => main().catch(log));

async function main(){
  const key = await post('Test');
  log(key);
}

function post(data){
  const buf = Buffer.from(data);
  const uid = genUid();
  const bnd = genBnd();

  return new Promise((resolve, reject) => {
    const opts = {
      method: 'POST',
      host: 'file.io',
      path: '/',
      port: 443,
      headers: {
        'content-type': `multipart/form-data; boundary=${bnd}`,
      },
    }

    const req = https.request(opts, res => {
      const bufs = [];

      res.on('data', buf => bufs.push(buf));

      res.on('end', () => {
        const json = Buffer.concat(bufs);
        const obj = JSON.parse(json);
        if(!obj.success) return reject(obj);
        resolve(obj.key);
      });
      
      res.on('error', reject);
    });

    req.on('error', reject);

    req.write(`--${
      bnd
    }\r\nContent-Disposition: form-data; name="qquuid"\r\n\r\n${
      uid
    }\r\n--${
      bnd
    }\r\nContent-Disposition: form-data; name="qqtotalfilesize"\r\n\r\n${
      buf.length
    }\r\n--${
      bnd
    }\r\nContent-Disposition: form-data; name="file"; filename="1"\r\nContent-Type: octet-stream\r\n\r\n`);

    req.write(buf);
    
    req.write(`\r\n--${
      bnd
    }--\r\n\r\n`);
    req.end();
  });
}

function genUid(){
  return [8, 4, 4, 4, 12].map(a => {
    return O.ca(a, () => O.rand(16).toString(16)).join('');
  }).join('-');
}

function genBnd(){
  return Buffer.from(O.ca(32, () => O.rand(256))).toString('hex');
}