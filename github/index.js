'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var encryptor = require('../encryptor');
var minifier = require('../minifier');
var tempDir = require('../temp-dir')(__filename);

var repos = require('./repos.json');
var noCopyList = require('./no-copy-list.json');
var skipList = require('./skip-list.json');
var supportedExtensions = require('./supported-extensions.json');

var cwd = __dirname;
var readmesDir = path.join(cwd, 'readmes');
var readmeFileName = 'readme.md';
var licenseFile = path.join(cwd, 'license.md');
var licenseFileName = 'license.md';

var tabSize = 2;

module.exports = {
  push
};

function push(repoName, cb=O.nop){
  var cwd = process.cwd();

  var gitInit = path.join(cwd, 'git-init.bat');
  var gitInitTemp = path.join(cwd, 'git-init-temp.bat');
  var gitPush = path.join(cwd, 'git-push.bat');

  var user = repos.user;
  var repo = repos.repos[repoName];

  Object.setPrototypeOf(repo, null);
  var {name, src, dest, encrypt, minify, script} = repo;

  name = normalizeString(name);
  dest = normalizeString(dest);

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

  if(fs.existsSync(tempDir))
    fsRec.deleteFilesSync(tempDir);

  // Copy readme file

  var readmeFile = path.join(readmesDir, `${name}.md`);
  var readmeData = fs.readFileSync(readmeFile, 'utf8');
  var readmeFileDest = path.join(dest, readmeFileName);
  fs.writeFileSync(readmeFileDest, readmeData);

  // Copy license file

  var licenseData = fs.readFileSync(licenseFile, 'utf8');
  var licenseFileDest = path.join(dest, licenseFileName);
  fs.writeFileSync(licenseFileDest, licenseData);

  if(script){
    // Call script

    cp.spawnSync('node', [script]);
  }

  if(encrypt){
    // Encrypt

    fs.mkdirSync(tempDir);

    encryptor.encrypt(src, tempDir, O.password, err => {
      if(err) return cb(err);

      src = tempDir;
      copyAndPushFiles();
    });
  }else if(minify){
    // Minify

    fs.mkdirSync(tempDir);

    minifier.minify(src, tempDir, err => {
      if(err) return cb(err);

      src = tempDir;
      copyAndPushFiles();
    });
  }else{
    copyAndPushFiles();
  }

  function copyAndPushFiles(){
    // Copy files

    fsRec.processFilesSync(src, e => {
      var fp = e.fullPath;

      if(e.processed) return;

      if(!script){
        if(skipList.some(a => fp === a || fp.endsWith(`\\${a}`) || fp.includes(`\\${a}\\`))) return;
        if(noCopyList.some(a => e.name == a)) return;
      }

      var srcPath = e.relativePath.split(/[\/\\]/).slice(1).join('//');
      var destPath = path.join(dest, srcPath);

      if(e.isDir){
        if(!fs.existsSync(destPath)){
          fs.mkdirSync(destPath);
        }
      }else{
        var ext = path.parse(destPath).ext.substring(1);
        if(!supportedExtensions.some(a => ext == a)) return;

        var content = fs.readFileSync(e.fullPath);
        content = processFileContent(e.name, ext, content);
        fs.writeFileSync(destPath, content);
      }
    });

    // Push files

    cp.execSync(gitPush, {
      cwd: dest
    });

    // Remove temp dir

    if(fs.existsSync(tempDir))
      fsRec.deleteFilesSync(tempDir);

    // Call callback

    cb(null);
  }
}

function processFileContent(file, ext, buff){
  var str = buff.toString();

  if([
    'js',
    'json',
    'htm',
    'html',
    'css',
    'java',
    'bat',
    'glsl',
  ].includes(ext)) {
    str = str.replace(/\t/g, ' '.repeat(tabSize));
    buff = Buffer.from(str);
  }

  switch(file){
    case 'projects.txt': return O.sanl(str).filter(a => a !== 'blank' && a !== 'test').join('\r\n'); break;
  }

  return buff;
}

function resetDir(dir){
  fsRec.processFilesSync(dir, e => {
    var isGit = /(?:^|[\/\\])\.git(?:[^a-zA-Z0-9]|$)/.test(e.fullPath);

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

function normalizeString(str){
  return str.replace(/\%([^\%]*)\%/g, (match, param) => {
    switch(param){
      case 'user': return repos.user.toLowerCase(); break;
    }
  });
}