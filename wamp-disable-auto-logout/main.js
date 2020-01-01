'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const main = () => {
  rec('C:/wamp', proc);
};

const proc = pth => {
  const buf = O.rfs(pth);
  if(buf.includes(0)) return;

  let matches = 0;
  const str = buf.toString().replace(/\D1440\D/g, a => {
    matches++;
    return a[0] + '2147483647' + O.last(a);
  });

  if(matches === 0) return;

  log(pth, '--->', matches);
  O.wfs(pth, str);
};

const rec = (pth, f) => {
  const stat = fs.statSync(pth);

  if(stat.isFile()){
    f(pth);
    return;
  }

  if(stat.isDirectory()){
    for(const file of fs.readdirSync(pth))
      rec(path.join(pth, file), f);
    return;
  }
};

main();