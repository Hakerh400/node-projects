'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const rmi = require('../..');
const Realm = require('./realm');
const Window = require('./window');
const Tab = require('./tab');

const defaultRealm = new Realm('Default');
const incoRealm = new Realm('Incognito');

const windows = O.obj();
const tabs = O.obj();

const methods = {
  async create(tabRaw){
    const {realm, win, tab} = getTabInfo(tabRaw);
  },

  async update(tabId, ){
    // const {realm, winId, tabId} = getTabInfo(tabRaw);
  },

  async move(info){

  },

  async replace(info){

  },

  async remove(info){

  },
};

const getTabInfo = tabRaw => {
  const realm = getRealm(tabRaw);
  const winId = getWinId(tabRaw);
  const tabId = getTabId(tabRaw);

  if(!O.has(windows, winId)){
    const win = new Window(winId);

    windows[winId] = win;
    realm.addWindow(win);
  }

  const win = windows[winId];

  if(!O.has(tabs, tabId)){
    const {index} = tabRaw;
    const tab = new Tab(tabId);

    tabs[tabId] = tab;
    win.addTab(tab, index);
  }

  const tab = tabs[tabId];

  return {
    realm,
    win,
    tab,
  };
};

const getRealm = tabRaw => {
  if(tabRaw.incognito) return incoRealm;
  return defaultRealm;
};

const getWinId = tabRaw => {
  return tabRaw.windowId;
};

const getTabId = tabRaw => {
  return tabRaw.id;
};

module.exports = methods;