'use strict';

const electron = require('electron');

const {log} = console;
const {app, Menu, ipcMain} = electron;

const args = process.argv.slice(2);

const main = () => {
  if(args.length !== 1)
    throw new TypeError(`Expected exactly one argument`);

  const project = args[0];

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
      label: 'Game',
      submenu: [
        {
          label: 'Restart',
          role: 'reload',
        }, {
          label: 'Exit',
          click(){
            win.close();
          },
        },
      ],
    }, {
      label: 'Scoreboard',
      submenu: [
        {
          label: 'Clear',
          click(){
            contents.send('scoreboard', 'clear');
          },
        },
      ],
    }, {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          role: 'togglefullscreen'
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

  win.loadURL(`http://localhost/web/?project=${project}`);
  win.maximize();

  win.on('ready-to-show', () => {
    win.show();
  });

  // contents.setIgnoreMenuShortcuts(true);
};

app.once('ready', main);