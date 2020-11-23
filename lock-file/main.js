'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const cp = require('child_process');
const O = require('../omikron');

let hostname = null;
let username = null;
let principal = null;

const main = async () => {
  const args = process.argv.slice(2);

  if(args.length === 0)
    O.err('Expected path as argument');

  const pth = args.join(' ').replace(/"/g, '');
  await takeown(pth, 0);

  const locked = await isLocked(pth);
  await takeown(pth);

  if(!locked){
    await lock(pth);
    log('Locked');
  }else{
    await unlock(pth);
    log('Unlocked');
  }
};

const isLocked = async pth => {
  if(!fs.existsSync(pth)){
    try{
      O.wfs(pth, '');
    }catch(err){
      log(err);
      return 1;
    }
  }

  return 0;
};

const lock = async pth => {
  await gainControl(pth);
  await setReadonly(pth);
};

const unlock = async pth => {
  // Administrator
};

const takeown = async (pth, checkExit) => {
  await spawn('takeown', ['/f', pth], checkExit);
};

const gainControl = async pth => {
  await resetRights(pth);
  await disableInheritance(pth);
  await adminFullControl(pth);
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

const getPrincipal = async () => {
  if(principal === null){
    const hostname = await getHostname();
    const username = await getUsername();
    principal = `${hostname.toUpperCase()}\\${username}`;
  }

  return principal;
};

const getHostname = async () => {
  if(hostname === null)
    hostname = (await spawn('hostname')).stdout.toString();

  return hostname;
};

const getUsername = async () => {
  if(username === null)
    username = (await spawn('username')).stdout.toString();

  return username;
};

const spawn = (prog, args=[], checkExit=1) => new Promise((res, rej) => {
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