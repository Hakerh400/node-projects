'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');
const blank = require('.');

electron.app.once('ready', init);

function init(){
  var win = new electron.BrowserWindow({width:500, height:500, show:false});

  win.mainFunc = main;

  win.loadURL(`data:text/html;base64,${Buffer.from(`<script>'use strict';(${() => {
    window.addEventListener('load', () => {
      const electron = require('electron');
      const win = electron.remote.getCurrentWindow();

      win.mainFunc(window);
    });
  }})()</script>`).toString('base64')}`);
}

function main(window){
  log('ok');
  window.document.body.style.backgroundColor = '#0f0';
  win.show();
}