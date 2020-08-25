'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const readline = require('../readline');

const channelsDir = 'D:/Videos/Other/Folder/Channels';
const indexPad = 3;

const main = async () => {
  const ps = await getParams();
  const dir = path.join(channelsDir, ps.channel);

  for(const file of fs.readdirSync(dir)){
    const f1 = path.join(dir, file);
    const f2 = path.join(dir, file.replace(/^\[\d+\]\s*/, ''));

    if(f1 !== f2)
      fs.renameSync(f1, f2);
  }

  const batchFile = path.join(dir, 'd.bat');
  
  if(fs.existsSync(batchFile))
    fs.unlinkSync(batchFile);

  const files = fs.readdirSync(dir);
  let i = ps.offset;

  for(const vid of ps.vids){
    const j = files.findIndex(f => path.parse(f).name.endsWith(vid));
    if(j === -1) continue;

    const indexStr = String(i++);
    assert(indexStr.length <= indexPad);

    const file = files[j];
    const f1 = path.join(dir, file);
    const f2 = path.join(dir, `[${indexStr.padStart(indexPad, '0')}] ${file}`);

    fs.renameSync(f1, f2);
  }

  log('Finished');
};

const getParams = async () => {
  const rl = readline.rl();

  rl.on('sigint', () => {
    exit();
  });

  const channel = await rl.aska('Channel: ');
  const offsetStr = await rl.aska('Offset: ');

  if(!/^(?:0?|[1-9][0-9]*)$/.test(offsetStr))
    err(`Invalid offset ${O.sf(offsetStr)}`);

  const offset = offsetStr !== '' ? BigInt(offsetStr) : 1n;

  log('Video IDs:\n');

  const vids = await (() => {
    return new Promise(res => {
      const onLine = id => {
        if(id === ''){
          rl.removeListener('line', onLine);
          rl.close();
          res(vids);
          return;
        }

        if(!/^[a-zA-Z0-9\-_]{11}$/.test(id))
          err(`Invalid video ID ${O.sf(id)}`);

        vids.push(id);
      };

      const vids = [];

      rl.on('line', onLine);
    });
  })();

  return {channel, offset, vids};
};

const err = msg => {
  log(`\nERROR: ${msg}`);
  O.proc.exit();
};

const exit = () => {
  log('\n\nTerminating');
  O.proc.exit();
};

main().catch(O.error);