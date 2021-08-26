'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');

const {log} = console;
const {app, Menu, ipcMain} = electron;

const project = 'math';

const cwd = __dirname;
const mainFile = path.join(cwd, 'main.js');

const main = () => {
  app.commandLine.appendSwitch('disable-http-cache');

  const {BrowserWindow} = require('electron');

  const win = new BrowserWindow({
    frame: true,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: '',
    icon: null,
  });

  const contents = win.webContents;

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload',
          role: 'reload',
        }, {
          label: 'Exit',
          click(){
            win.close();
          },
        },
      ],
    }, {
      label: 'Dev',
      submenu: [
        {
          label: 'Open DevTools',
          click(){
            win.webContents.openDevTools();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  win.loadURL(`data:text/html;base64,${Buffer.from(`<script>${
    `window.addEventListener('load',()=>require(${JSON.stringify(mainFile)}))`
  }</script>`).toString('base64')}`);

  win.webContents.openDevTools();
  win.maximize();

  win.on('ready-to-show', () => {
    win.show();
  });

  // contents.setIgnoreMenuShortcuts(true);
};

app.once('ready', main);