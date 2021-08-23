'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const querystring = require('querystring');
const O = require('../omikron');
const readline = require('../readline');

const port = 80;

const cwd = __dirname;
const rootDir = path.join(cwd, '../..');

let server = null;
let rl = null;

const main = () => {
  server = http.createServer(onReq);

  server.listen(port, () => {
    log(`Server is listening on port ${port}`);
  });

  rl = readline.rl();
  rl.on('line', onInput);
};

const onInput = str => {
  str = str.trim();

  if(str === '') return;

  if(/^q$/i.test(str)){
    server.close();
    rl.close();
    server = null;
    rl = null;
    return;
  }

  log('Unknown command');
};

const onReq = (req, res) => {
  const url = new URL(`http://localhost${req.url}`);
  const urlPath = url.pathname;

  const e404 = () => {
    res.statusCode = 404;
    res.end('Page not found');
  };

  const send = pth => {
    if(!fs.existsSync(pth)) return 0;

    const stat = fs.statSync(pth);

    if(stat.isFile()){
      fs.createReadStream(pth).pipe(res);
      return 1;
    }

    if(!stat.isDirectory()) return 0;
    return send(path.join(pth, 'index.htm'));
  };

  const pth = path.join(rootDir, urlPath);
  if(!send(pth)) e404();
};

main();