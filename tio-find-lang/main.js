'use strict';

const fs = require('fs');
const path = require('path');
const URL = require('url');
const https = require('https');
const crypto = require('crypto');
const assert = require('assert');
const O = require('../omikron');

const url = 'https://tio.run/cgi-bin/static/fb67788fd3d1ebf92e66b295525335af-run';
const msgTemplate = 'Vlang(0)1(0)(1)(0)VTIO_OPTIONS(0)0(0)F.code.tio(0)(2)F.input.tio(0)0(0)Vargs(0)0(0)R'.
  replace(/\(0\)/g, '\x00');

const main = async () => {
  const lang = 'javascript-node';
  const code = `console.log('ok'+(1+2))`;

  const msg = msgTemplate.
    replace(/\(1\)/, lang).
    replace(/\(2\)/, `${code.length}\x00${code}`);

  const result = await new Promise((resolve, reject) => {
    const urlInfo = URL.parse(url);
    log(urlInfo)
    return;

    const req = http.request({
      host: urlInfo.host,
      path: urlInfo.path,
      port: 443,
      method: 'POST',
    }, res => {
      const bufs = [];

      res.on('data', buf => {
        bufs.push(data);
      });

      res.on('end', buf => {
        bufs.push(data);
      });
    });
  });
};

main();