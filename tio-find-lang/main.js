'use strict';

const fs = require('fs');
const path = require('path');
const URL = require('url');
const https = require('https');
const zlib = require('zlib');
const assert = require('assert');
const O = require('../omikron');
const download = require('../download');
const logStatus = require('../log-status');

const TIMEOUT = 7e3;

const langsUrl = 'https://tio.run/static/3fbdee7a34cd8d340fe2dbd19acd2391-languages.json';
const runUrl = 'https://tio.run/cgi-bin/static/fb67788fd3d1ebf92e66b295525335af-run';
const msgTemplate = 'Vlang(0)1(0)(1)(0)VTIO_OPTIONS(0)0(0)F.code.tio(0)(2)F.input.tio(0)0(0)Vargs(0)0(0)R'.
  replace(/\(0\)/g, '\x00');

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const codeFile = path.join(testDir, 'code.txt');
const targetFile = path.join(testDir, 'target.txt');

const code = O.lf(O.rfs(codeFile, 1));
const target = O.lf(O.rfs(targetFile, 1));

const main = async () => {
  const langsInfo = JSON.parse(await download(langsUrl));
  const langs = O.keys(langsInfo);
  const langsNum = langs.length;

  for(let i = 1; i <= langsNum; i++){
    const lang = langs[i - 1];
    const info = langsInfo[lang];

    if(info.encoding !== 'UTF-8')
      continue;

    logStatus(i, langsNum, `language ${O.sf(lang)}`);

    const output = await run(lang, code);

    if(output === null){
      log.inc();
      log('Timeout');
      log.dec();
      continue;
    }

    if(output.trim() === target){
      O.logb();
      log(info.name);
      return;
    }
  }
};

const run = async (lang, code) => {
  try{
    return await runRaw(lang, code);
  }catch(err){
    if(err === 'timeout')
      return null;

    throw err;
  }
};

const runRaw = async (lang, code) => {
  let msg = msgTemplate.
    replace(/\(1\)/, lang).
    replace(/\(2\)/, `${code.length}\x00${code}`);

  msg = await apply(msg, zlib.DeflateRaw({level: 9}));

  let result = await new Promise((res, rej) => {
    const urlInfo = URL.parse(runUrl);

    const req = https.request({
      host: urlInfo.host,
      path: urlInfo.path,
      port: 443,
      method: 'POST',
    }, response => {
      const {statusCode} = response;

      if(statusCode !== 200)
        return rej(new Error(`Status code: ${statusCode}`));

      readAllData(response).then(res, rej);
    });

    req.end(msg);
  });

  result = String(await apply(result, zlib.Gunzip()));

  const sep = result.slice(0, 16);
  result = result.split(sep)[1];

  return result;
};

const apply = (str, stream) => {
  stream.end(str);
  return readAllData(stream);
};

const readAllData = (stream, timeout=TIMEOUT) => {
  return new Promise((res, rej) => {
    const onTimeout = () => {
      stream.destroy();
      rej('timeout');
    };

    const tId = timeout !== null ?
      setTimeout(onTimeout, timeout) : null;

    const bufs = [];

    stream.on('data', buf => {
      bufs.push(buf);
    });

    stream.on('end', buf => {
      clearTimeout(tId);
      res(Buffer.concat(bufs));
    });

    stream.on('error', rej);
  });
};

main();