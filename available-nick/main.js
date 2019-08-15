'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const vm = require('vm');
const cp = require('child_process');
const net = require('net');
const http = require('http');
const https = require('https');
const stream = require('stream');
const crypto = require('crypto');
const readline = require('readline');
const O = require('../omikron');
const media = require('../media');
const arrOrder = require('../arr-order');
const format = require('../format');
const logSync = require('../log-sync');
const debug = require('../debug');

(async () => {
  const chars = O.chars('a', 26) + O.chars('0', 10) + '-';
  const num = (chars.length + 1) ** 4;
  const start = 2328;

  for(let i = start; i <= num; i++){
    const nick = arrOrder.str(chars, i);
    if(/^\-|\-$|\-\-/.test(nick)) continue;

    media.logStatus(i - start + 1, num - start + 1, `nick ${i} (${nick})`);

    const found = await new Promise((resolve, reject) => {
      https.get(`https://github.com/${nick}`, res => {
        res.resume();
        res.on('end', () => {
          const status = res.statusCode;
          if(status === 200) resolve(0);
          else if(status === 404) resolve(1);
          else reject(new Error(`Status code: ${status}`));;
        });
      });
    });

    if(found){
      log(`\nFound: ${nick}`);
      break;
    }
  }
})().catch(log);