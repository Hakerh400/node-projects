'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const fsRec = require('../fs-rec-legacy');
const tempDir = require('../temp-dir')(__filename);

const repos = require('./repos.json');
const noCopyList = require('./exclude-list.json');
const skipList = require('./skip-list.json');
const supportedExts = require('./supported-exts.json');

const KW_EXCL = 'GIT\x5FEXCLUDE';
const TAB_SIZE = 2;
const LINE_SEP = '\r\n';

const TAB = ' '.repeat(TAB_SIZE);

const cwd = __dirname;
const readmesDir = path.join(cwd, 'readmes');
const readmeFileName = 'readme.md';
const licenseFile = path.join(cwd, 'license.md');
const licenseFileName = 'license.md';

module.exports = {
  push,
};

async function push(repoName, cb=O.nop){
  var gitInit = path.join(cwd, 'git-init.bat');
  var gitInitTemp = path.join(cwd, 'git-init-temp.bat');
  var gitPush = path.join(cwd, 'git-push.bat');

  var user = repos.user;
  if(!repos.repos.hasOwnProperty(repoName))
    throw new TypeError('Unknown repository');
  
  var repo = repos.repos[repoName];

  Object.setPrototypeOf(repo, null);
  var {owner, name, src, dest, encrypt, minify, script, newLine, includeAll} = repo;

  if(owner) user = owner;

  name = normalizeStr(name);
  dest = normalizeStr(dest);

  src = path.normalize(src);
  dest = path.normalize(dest);

  // Reset directory

  if(!fs.existsSync(dest)){
    fs.mkdirSync(dest);

    var replacements = [
      `https://github.com/${user}/${name}.git`,
    ];

    var batchContent = fs.readFileSync(gitInit).toString();
    batchContent = batchContent.replace(/\`(\d+)\`/g, (a, b) => replacements[b | 0]);
    fs.writeFileSync(gitInitTemp, batchContent);

    cp.execSync(gitInitTemp, {
      cwd: dest
    });

    fs.unlinkSync(gitInitTemp);
  }

  await resetDir(dest);

  if(fs.existsSync(tempDir))
    await fsRec.deleteFilesSync(tempDir);

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

  if(encrypt)
    throw new TypeError('Encryption is not supported');

  await copyAndPushFiles();

  async function copyAndPushFiles(){
    // Copy files

    await fsRec.processFilesSync(src, e => {
      if(e.processed) return;

      var fp = e.fullPath;
      if(fp.includes(KW_EXCL)) return;

      if(!script){
        if(/node_modules|package\-lock\.json/.test(fp)) return;

        if(!includeAll){
          if(/\\test(?:[\\\-\.]|$)/.test(fp)) return;
          if(skipList.some(a => fp === a || fp.endsWith(`\\${a}`) || fp.includes(`\\${a}\\`))) return;
          if(noCopyList.some(a => e.name == a)) return;
        }
      }

      var srcPath = e.relativePath.split(/[\/\\]/).slice(1).join('//');
      var destPath = path.join(dest, srcPath);

      if(e.isDir){
        if(!fs.existsSync(destPath))
          fs.mkdirSync(destPath);
        return;
      }

      var ext = path.parse(destPath).ext.substring(1);

      var isSupported = O.keys(supportedExts).some(type => {
        return supportedExts[type].includes(ext);
      });

      if(!isSupported) return;

      var content = fs.readFileSync(e.fullPath);

      if(supportedExts.text.includes(ext)){
        var str = content.toString('utf8');
        content = processFileContent(e.name, str);

        if(newLine)
          content += LINE_SEP;
      }

      fs.writeFileSync(destPath, content);
    });

    // Push files

    cp.execSync(gitPush, {
      cwd: dest,
    });

    // Remove temp dir

    if(fs.existsSync(tempDir))
      await fsRec.deleteFilesSync(tempDir);

    // Call callback

    cb(null);
  }
}

function processFileContent(file, str){
  var lines = O.sanl(str);
  var included = 1;

  lines = lines.filter(line => {
    var exclude = line.includes(KW_EXCL);

    if(exclude){
      included ^= 1;
      return 0;
    }

    return included;
  });

  if(!included)
    throw new TypeError(`Unmatched ${KW_EXCL} keyword in "${file}"`);

  lines = lines.map(line => {
    return line.replace(/\t/g, TAB);
  })

  switch(file){
    case 'projects.txt':
      lines = lines.filter(line => {
        return !skipList.includes(line);
      });
      break;
  }

  return lines.join(LINE_SEP);
}

async function resetDir(dir){
  await fsRec.processFilesSync(dir, e => {
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

function normalizeStr(str){
  return str.replace(/\%([^\%]*)\%/g, (match, param) => {
    switch(param){
      case 'user': return repos.user.toLowerCase(); break;
    }
  });
}