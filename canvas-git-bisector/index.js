'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../framework');
const ffn = require('../format-file-name');

const ORIGIN = 'o';
const START = '188c4ca7f2ea510991e1da390a22f06f69405af2';

const GOOD_BUILD_STR = 'Good build';
const BAD_BUILD_STR = 'Bad build';

class BisectInfo{
  constructor(c1, c2){
    this.cs = [c1, c2];
  }

  toString(){
    var len = Math.max(GOOD_BUILD_STR.length, BAD_BUILD_STR.length);

    return this.cs.map(([c, t]) => {
      var s = `${t ? GOOD_BUILD_STR : BAD_BUILD_STR}:`.padEnd(len + 2);
      return `${s}${c}`;
    }).join('\n');
  }
};

module.exports = {
  bisect,
};

function bisect(dir, first=null){
  var canvasDir = ffn(dir);
  var script = path.join(canvasDir, 'main.js');
  var gitDir = path.join(canvasDir, 'node_modules/canvas');

  var git = (...args) => spawnGit(gitDir, ...args);
  var bat = (...args) => spawnBatch(canvasDir, ...args);

  git(`checkout ${ORIGIN}/master`);

  var cs = git('log --pretty=oneline --no-decorate')
    .split(/\r\n|\r|\n/)
    .map(a => a.trim()).filter(a => a)
    .map(a => a.substring(0, 40)).reverse();

  if(cs.length <= 1)
    throw new TypeError('Expected at least 2 commits');

  var i = first !== null ? first : cs.indexOf(START);
  var j = cs.length - 1;

  var out1 = test(i);
  var out2 = test(j);

  if(out1 === out2)
    throw new TypeError('Nothing to bisect');

  while(j - i !== 1){
    log(`${i} ${j}`);

    var k = i + j >> 1;
    if(test(k) === out1) i = k;
    else j = k;
  }

  log();

  return new BisectInfo([cs[i], out1], [cs[j], out2]);

  function test(i){
    if(i !== (i | 0)) throw new TypeError(`Unknown commit index ${i}`);
    if(i < 0 || i >= cs.length) throw new RangeError(`Commit index ${i} is out of bounds`);

    var c = cs[i];
    git(`checkout ${c}`);
    bat('c');

    var out = bat('b');
    if(out === '1') return 1;
    else if(out === '0') return 0;
    else throw new TypeError(`Unknown result\n${out}\nat commit ${c}`);
  }
}

function spawnGit(dir, args){
  if(typeof args === 'string')
    args = [args];

  return args.map(args => {
    args = args.split` `;
    return spawn('git', args, {cwd: dir});
  }).join('\n');
}

function spawnBatch(dir, name){
  var file = path.join(dir, `${name}.bat`);
  return spawn(file, [], {cwd: dir});
}

function spawn(...args){
  var result = cp.spawnSync(...args);
  var stdout = stringify(result.stdout);
  var stderr = stringify(result.stderr);
  return stdout + stderr;
}

function stringify(buf){
  if(buf === null) return '';
  return buf.toString('utf8');
}