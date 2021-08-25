'use strict';

const electron = require('electron');

const {log} = console;
const {app, Menu, ipcMain} = electron;

const project = 'math';

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

  // const template = [
  //   {
  //     label: 'Game',
  //     submenu: [
  //       {
  //         label: 'Restart',
  //         role: 'reload',
  //       }, {
  //         label: 'Exit',
  //         click(){
  //           win.close();
  //         },
  //       },
  //     ],
  //   }, {
  //     label: 'Scoreboard',
  //     submenu: [
  //       {
  //         label: 'Clear',
  //         click(){
  //           contents.send('scoreboard', 'clear');
  //         },
  //       },
  //     ],
  //   }, {
  //     label: 'View',
  //     submenu: [
  //       {
  //         label: 'Toggle Fullscreen',
  //         role: 'togglefullscreen'
  //       },
  //     ],
  //   }, {
  //     label: 'Dev',
  //     submenu: [
  //       {
  //         label: 'Open DevTools',
  //         role: 'toggleDevTools',
  //       },
  //     ],
  //   },
  // ]
  //
  // const menu = Menu.buildFromTemplate(template);
  // Menu.setApplicationMenu(menu);

  Menu.setApplicationMenu(null);

  win.loadURL(`http://localhost/web/?project=${project}`);
  win.maximize();
  win.show();

  // contents.setIgnoreMenuShortcuts(true);
};

app.once('ready', main);