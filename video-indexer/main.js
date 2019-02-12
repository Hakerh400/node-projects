'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const readline = require('../readline');

const channelsDir = 'D:/Videos/Other/Folder/Channels';

setTimeout(() => main().catch(log));

async function main(){
  const {channel, vids} = await getParams();

  const dir = path.join(channelsDir, channel);

  for(const file of fs.readdirSync(dir)){
    const f1 = path.join(dir, file);
    const f2 = path.join(dir, file.replace(/^\[\d+\]\s*/, ''));

    if(f1 !== f2)
      fs.renameSync(f1, f2);
  }

  const files = fs.readdirSync(dir);
  let i = 0;

  for(const vid of vids){
    const j = files.findIndex(f => path.parse(f).name.endsWith(vid));
    if(j === -1) continue;
    i++;

    const file = files[j];
    const f1 = path.join(dir, file);
    const f2 = path.join(dir, `[${i.toString().padStart(3, '0')}] ${file}`);

    fs.renameSync(f1, f2);
  }

  log('Finished');
}

async function getParams(){
  const rl = readline.rl();

  rl.on('sigint', () => {
    exit();
  });

  const channel = await rl.aska('Channel: ');
  const vids = [];
  
  log('Video IDs:\n');

  while(1){
    const id = await rl.aska();
    if(id === '') break;

    if(!/^[a-zA-Z0-9\-_]{11}$/.test(id))
      err('Invalid video ID');

    vids.push(id);
  }

  rl.close();

  return {channel, vids};
}

function err(msg){
  log(`\nERROR: ${msg}`);
  O.proc.exit();
}

function exit(){
  log('\n\nTerminating');
  O.proc.exit();
}