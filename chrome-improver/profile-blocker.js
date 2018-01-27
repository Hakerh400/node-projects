'use strict';

var fs = require('fs');
var path = require('path');
var fsys = require('./file-system.js');
var asyncFuncs = require('./async-funcs.js');
var chromeProcessKiller = require('./chrome-process-killer.js');
var env = require('./environment.js');

module.exports = {
  thumbnails: {
    block: blockThumbnails,
    unblock: unblockThumbnails
  },
  flash: {
    block: blockFlash,
    unblock: unblockFlash
  }
};

function blockThumbnails(cb){
  processChromeFiles(0, true, cb);
}

function unblockThumbnails(cb){
  processChromeFiles(0, false, cb);
}

function blockFlash(cb){
  processChromeFiles(1, true, cb);
}

function unblockFlash(cb){
  processChromeFiles(1, false, cb);
}

function processChromeFiles(type, block = true, cb){
  var appData = env.getAppDataPath();
  appData = appData.split`\\`;
  appData.pop();
  appData = appData.join`/`;

  var chromeDir = `${appData}/Local/Google/Chrome/User Data`;

  var profileDirs = fs.readdirSync(chromeDir).filter(dir => {
    return /^(?:default|profile \d+)$/i.test(dir);
  });

  profileDirs.push(
    '.',
    'System Profile'
  );

  var fileNames = [
    [
      'History',
      'History-journal',
      'History Provider Cache',
      'Top Sites',
      'Top Sites-journal',
      'Thumbnails'
    ], [
      'PepperFlash',
      'Pepper Data',
      'SwReporter'
    ]
  ][type];

  var files = profileDirs.reduce((files, profileDir) => {
    profileDir = path.join(chromeDir, profileDir);

    fileNames.forEach(fileName => {
      fileName = path.join(profileDir, fileName);
      files.push(fileName);
    });

    return files;
  }, []);

  asyncFuncs.exec([
    chromeProcessKiller.kill,
    cb => fsys.processMultipleFiles(files, block ? fsys.lockFile : fsys.deleteFile, cb)
  ], [], cb);
}