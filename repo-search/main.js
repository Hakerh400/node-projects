'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const O = require('../omikron');
const media = require('../media');

setTimeout(main);

function main(){
  const get = pth => new Promise((res, rej) => {
    https.get({
      hostname: 'api.github.com',
      path: pth,
      headers: { 'User-Agent': 'Node.js' },
    }, r => {
      const bufs = [];

      r.on('data', a => bufs.push(a));
      r.on('error', rej);
      r.on('end', () => res(Buffer.concat(bufs).toString()));
    }).on('error', rej);
  });

  (async () => {
    const n = 28633;

    for(let i = 1; i <= n; i++){
      media.logStatus(i, n, 'post');

      let str = null;

      try{
        const str1 = await get(`/repos/nodejs/node/issues/${i}`);
        const str2 = await get(`/repos/nodejs/node/issues/${i}/comments`);

        str = `${str1}${str2}`;
      }catch{}

      if(str === null){
        log('ERROR');
        continue;
      }

      if(str.includes('test')){
        log('\n\nFOUND!');
        break;
      }
    }
  })().catch(log);
}