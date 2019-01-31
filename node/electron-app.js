'use strict';

const DEBUG = 1;

const fs = require('fs');
const path = require('path');
const electron = require('electron');

const s = 500;

const cwd = process.cwd();
const mainFile = path.join(cwd, process.argv[2]);

electron.app.once('ready', main);

function main(){
  const ipc = electron.ipcMain;

  ipc.on('log', (evt, args) => console.log.apply(null, args));
  ipc.on('info', (evt, args) => console.info.apply(null, args));
  ipc.on('error', (evt, args) => console.error.apply(null, args));
  ipc.on('logRaw', (evt, data) => logRaw(data));

  const win = new electron.BrowserWindow({
    width: s,
    height: s,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if(DEBUG){
    win.webContents.openDevTools();

    win.on('ready-to-show', () => {
      win.maximize();
      win.show();
    });
  }

  win.loadURL(`data:text/html;base64,${Buffer.from(`<script>${
    `window.addEventListener('load',()=>require(${JSON.stringify(mainFile)}))`
  }</script>`).toString('base64')}`);
}

function logRaw(data){
  process.stdout.write(data);
}