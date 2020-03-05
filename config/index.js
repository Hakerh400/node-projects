'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const config = require('./config');

const IS_TRAVIS = process.env.TRAVIS === 'true';

config.isTravis = IS_TRAVIS;

// Initialize executables
{
  const {exe} = config;

  for(const key of O.keys(exe)){
    let exePath = exe[key];

    if(exePath === null){
      switch(key){
        case 'node': exePath = process.execPath; break;
        default: assert.fail(); break;
      }
    }

    exe[key] = path.normalize(
      IS_TRAVIS ?
      path.parse(exePath).name :
      resolveFile(exePath)
    );
  }
}

config.exe.node = process.execPath;

module.exports = config;

function resolveFile(file){
  return file.replace(/%([^%]+)%/g, (a, b) => process.env[b]);
}