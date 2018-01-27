'use strict';

module.exports = {
  getSystemDrive,
  getAppDataPath
};

function getSystemDrive(){
  return process.env.systemdrive[0];
}

function getAppDataPath(){
  return process.env.appdata;
}