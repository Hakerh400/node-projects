'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var encryptor = require('../encryptor');

var repos = require('./repos.json');
var noCopyList = require('./no-copy-list.json');
var supportedExtensions = require('./supported-extensions');

module.exports = {
  push
};

function push(repoName, cb = O.nop){
  var cwd = process.cwd();

  var gitInit = path.join(cwd, 'git-init.bat');
  var gitInitTemp = path.join(cwd, 'git-init-temp.bat');
  var gitPush = path.join(cwd, 'git-push.bat');
  var tmpDir = path.join(cwd, 'tmp');

  var user = repos.user;
  var repo = repos.repos[repoName];
  var {name, src, dest, encrypt} = repo;

  src = path.normalize(src);
  dest = path.normalize(dest);

  // Reset directory

  if(!fs.existsSync(dest)){
    fs.mkdirSync(dest);

    var replacements = [
      `https://github.com/${user}/${name}.git`
    ];

    var batchContent = fs.readFileSync(gitInit).toString();
    batchContent = batchContent.replace(/\`(\d+)\`/g, (a, b) => replacements[b | 0]);
    fs.writeFileSync(gitInitTemp, batchContent);

    cp.execSync(gitInitTemp, {
      cwd: dest
    });

    fs.unlinkSync(gitInitTemp);
  }

  resetDir(dest);

  // Encrypt (if encryption is enabled)

  if(fs.existsSync(tmpDir)){
    fsRec.deleteFilesSync(tmpDir);
  }

  if(encrypt){
    fs.mkdirSync(tmpDir);

    encryptor.encrypt(src, tmpDir, O.password, err => {
      if(err) return cb(err);

      src = tmpDir;
      copyAndPushFiles();
    });
  }else{
    copyAndPushFiles();
  }

  function copyAndPushFiles(){
    // Copy files

    fsRec.processFilesSync(src, e => {
      if(e.processed) return;
      if(e.fullPath.includes('node_modules')) return;
      if(noCopyList.some(a => e.name == a)) return;

      var srcPath = e.relativePath.split(/[\/\\]/).slice(1).join`//`;
      var destPath = path.join(dest, srcPath);

      if(e.isDir){
        if(!fs.existsSync(destPath)){
          fs.mkdirSync(destPath);
        }
      }else{
        var ext = path.parse(destPath).ext.substring(1);
        if(!supportedExtensions.some(a => ext == a)) return;

        var content = fs.readFileSync(e.fullPath);
        fs.writeFileSync(destPath, content);
      }
    });

    // Push files

    cp.execSync(gitPush, {
      cwd: dest
    });
  }
}

function resetDir(dir){
  fsRec.processFilesSync(dir, e => {
    var isGit = e.fullPath.includes('.git');

    if(e.processed){
      if(e.fullPath != dir && !isGit){
        fs.rmdirSync(e.fullPath);
        return;
      }
    }

    if(e.isDir) return;

    if(!isGit){
      fs.unlinkSync(e.fullPath);
    }
  });
}