'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const O = require('../omikron');

const download = (url, pth=null) => new Promise((res, rej) => {
  let file = null;

  if(pth !== null){
    try{ file = fs.createWriteStream(pth); }
    catch(err){ rej(err); }
    file.on('error', rej);
  }

  const bufs = file === null ? [] : null;

  https.get(url, response => {
    const checkStatusCode = () => {
      const status = response.statusCode;
      if(status === 200) return 1;

      if(status === 302){
        download(response.headers.location, pth).then(res, rej);
        return 0;
      }

      rej(new Error(`Status code ${response.statusCode}`));
      return 0;
    };

    if(file !== null){
      response.pipe(file);
      file.on('finish', () => {
        if(!checkStatusCode()) return;
        res();
      });
      return;
    }

    response.on('data', buf => bufs.push(buf));

    response.on('end', () => {
      if(!checkStatusCode()) return;
      res(Buffer.concat(bufs).toString());
    });

    response.on('error', rej);
  }).on('error', rej);
});

module.exports = download;