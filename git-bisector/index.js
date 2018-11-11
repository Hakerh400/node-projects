'use strict';

const fs = require('fs');
const cp = require('child_process');
const O = require('../framework');
const fsRec = require('../fs-recursive');
const tempDir = require('../temp-dir')(__filename);

module.exports = {
  bisect,
};

function bisect(repo, firstCommit, nextCommit, checkFunc, cb=O.nop){
  var repoPath = `https://github.com/${repo}.git`;

  resetTempDir();

  spawnGit('init');
  spawnGit(`remote add origin ${repoPath}`);
  spawnGit('fetch');
  spawnGit('checkout -t origin/master');

  var commits = spawnGit('log --pretty=oneline --no-decorate');
  commits = commits.stdout.toString().split(/\r\n|\r|\n/);
  commits = commits.map(a => a.trim()).filter(a => a);
  commits = commits.map(a => a.substring(0, 40)).reverse();

  var n = commits.length;
  var i = firstCommit(n);

  var checkedCommits = O.ca(n, () => false);

  setTimeout(checkCommit);

  function checkCommit(){
    var commit = commits[i];
    spawnGit(`reset --hard ${commit}`);

    checkFunc(tempDir, result => {
      checkedCommits[i] = true;
      if(result) return cb(null, commit);

      i = nextCommit(i, n);
      if(i < 0 || i >= n || checkedCommits[i]) return cb(null, null);

      setTimeout(checkCommit);
    });
  }
}

function spawnGit(args){
  args = args.split` `;
  return cp.spawnSync('git', args, {cwd: tempDir});
}

function resetTempDir(){
  if(fs.existsSync(tempDir)) fsRec.deleteFilesSync(tempDir);
  fs.mkdirSync(tempDir);
}