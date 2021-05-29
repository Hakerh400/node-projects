'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const cp = require('child_process');
const O = require('../omikron');

const cwd = __dirname;
const chFiles = O.sanl(O.rfs(path.join(cwd, 'chrome-files.txt'), 1))

let hostname = null;
let username = null;
let principal = null;

const main = async () => {
  const args = process.argv.slice(2);

  if(args.length === 0)
    O.err('Expected file path as argument');

  const pth = args.join(' ').replace(/"/g, '');

  if(!pth.includes('*')){
    await processPth(pth);
    return;
  }

  const locked = [];
  const unlocked = [];

  for(const file of chFiles){
    const pthNew = pth.replace('*', file);
    const isLocked = await processPth(pthNew);

    if(isLocked) locked.push(pthNew);
    else unlocked.push(pthNew);
  }

  if(locked.length !== 0 && unlocked.length !== 0)
    for(const file of unlocked)
      await processPth(file);
};

const processPth = async pth => {
  log(`Processing "${pth}"`);
  log.inc();

  await takeown(pth, 0);

  const locked = await isLocked(pth);

  try{
    await createEmptyFile(pth);
  }catch{}

  await takeown(pth);
  await takeControl(pth);
  await assertFile(pth);

  if(!locked){
    await lock(pth);
    assert(await isLocked(pth));
    log('Locked');
  }else{
    await unlock(pth);
    assert(!await isLocked(pth));
    log('Unlocked');
  }

  log.dec();

  return locked;
};

const isLocked = async pth => {
  if(!fs.existsSync(pth)){
    try{
      await createEmptyFile(pth);
      fs.unlinkSync(pth);
    }catch{
      return 1;
    }
  }else{
    await assertFile(pth);
  }

  return 0;
};

const lock = async pth => {
  await createEmptyFile(pth);
  await setReadonly(pth);
  await clearRights(pth);
};

const unlock = async pth => {
  await clearReadonly(pth);
  await resetRights(pth);

  fs.unlinkSync(pth);
};

const takeown = async (pth, checkExit) => {
  await spawn('takeown', ['/f', pth], checkExit);
};

const takeControl = async pth => {
  await clearRights(pth);
  await adminFullControl(pth);
};

const clearRights = async pth => {
  await resetRights(pth);
  await disableInheritance(pth);
};

const resetRights = async pth => {
  await spawn('icacls', [pth, '/reset']);
};

const disableInheritance = async pth => {
  await spawn('icacls', [pth, '/inheritance:r']);
};

const adminFullControl = async pth => {
  await spawn('icacls', [pth, '/grant', `${await getPrincipal()}:F`]);
};

const setReadonly = async pth => {
  await spawn('attrib', ['+r', pth]);
};

const clearReadonly = async pth => {
  await spawn('attrib', ['-r', pth]);
};

const getPrincipal = async () => {
  if(principal === null){
    const hostname = await getHostname();
    const username = await getUsername();

    const p1 = `${hostname.toUpperCase()}\\${username}`;
    const p2 = await whoami();
    assert.strictEqual(p1.toLowerCase(), p2.toLowerCase());

    principal = p1;
  }

  return principal;
};

const getHostname = async () => {
  if(hostname === null)
    hostname = (await spawn('hostname')).stdout.toString().trim();

  return hostname;
};

const getUsername = async () => {
  if(username === null)
    username = process.env.username;

  return username;
};

const whoami = async () => {
  return (await spawn('whoami')).stdout.toString().trim();
};

const assertFile = async pth => {
  if(!fs.statSync(pth).isFile())
    O.err('Path is not a file');
};

const createEmptyFile = async pth => {
  O.wfs(pth, '');
};

const spawn = (prog, args=[], checkExit=1) => new Promise((res, rej) => {
  for(const arg of args)
    assert(typeof arg === 'string');

  return (async () => {
    const proc = cp.spawn(prog, args);
    const stdout = [];
    const stderr = [];

    proc.stdout.on('data', buf => stdout.push(buf));
    proc.stderr.on('data', buf => stderr.push(buf));

    proc.on('exit', code => {
      const out = Buffer.concat(stdout);
      const err = Buffer.concat(stderr);

      if(checkExit && code !== 0){
        log(prog, args);
        O.logb();
        log(out.toString());
        O.logb();
        log(err.toString());
        O.logb();
        assert.fail(`Exit code: ${code}`);
      }

      res({stdout, stderr, code});
    });
  })().catch(rej);
});

main();