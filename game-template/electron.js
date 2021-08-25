'use strict';

const electron = require('electron');

const {log} = console;
const {app, Menu} = electron;

const args = process.argv.slice(2);

const main = () => {
  if(args.length !== 1)
    O.exit(`Expected exactly one argument`);

  const project = args[0];

  app.commandLine.appendSwitch('disable-http-cache');

  const { BrowserWindow } = require('electron')
  const win = new BrowserWindow({frame: true,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'Magic Lines',
    icon: 'c:/users/thomas/downloads/untitled.ico'
  });
  const contents = win.webContents;

  const template = [
    // { role: 'fileMenu' }
    {
      label: 'Game',
      submenu: [
        {
          label: 'Exit',
          click(){
            win.close();
          },
        },
      ],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ]
    },
  ]

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  win.loadURL(`http://localhost/web/?project=${project}`);
  win.show();

  // contents.setIgnoreMenuShortcuts(true);
};

app.once('ready', main);