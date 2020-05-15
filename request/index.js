'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const urlm = require('url');
const http = require('http');
const https = require('https');
const O = require('../omikron');

const HTTP_PORT = 80;
const HTTPS_PORT = 443;

const nt = f => a => {
  process.nextTick(() => {
    f(a);
  });
};

const get = (url, file=null) => new Promise((res, rej) => {
  log(url);

  const resNt = nt(res);
  const rejNt = nt(rej);

  const urlInfo = urlm.parse(url);

  assert(urlInfo.protocol.endsWith(':'));
  const protocol = urlInfo.protocol.slice(0, urlInfo.protocol.length - 1);

  const httpm = (
    protocol === 'http' ? http :
    protocol === 'https' ? https :
    assert.fail(protocol)
  );

  const requset = httpm.request({
    hostname: urlInfo.host,
    port: (
      urlInfo.port !== null ? urlInfo.port :
      httpm === http ? HTTP_PORT : HTTPS_PORT
    ),
    path: urlInfo.path,
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      'User-Agent': 'Node.js',
    },
  }, response => {
    const status = response.statusCode;
    const type = status / 100 | 0;

    response.on('error', rej);

    if(type === 2){
      const st = file !== null ? fs.createWriteStream(file) : null;
      const bufs = file === null ? [] : null;

      if(st !== null){
        response.pipe(st);
      }else{
        response.on('data', buf => {
          bufs.push(buf);
        });
      }

      response.on('end', () => {
        res(bufs !== null ? Buffer.concat(bufs) : null);
      });

      return;
    }

    if(type === 3){
      response.on('end', () => {
        process.nextTick(() => {
          get(response.headers.location, file).then(resNt, rejNt);
        });
      });

      response.resume();
      return;
    }

    response.on('end', () => {
      rej(new Error(`Status code: ${status}`));
    });

    response.resume();
  });

  requset.on('error', rej);
  requset.end();
});

const post = (url, data='', file=null) => new Promise((res, rej) => {
});

module.exports = {
  get,
  post,
};