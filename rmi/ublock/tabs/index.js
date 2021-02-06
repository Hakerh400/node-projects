'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const rmi = require('../..');
const Realm = require('./realm');
const Window = require('./window');
const Tab = require('./tab');

const realms = O.obj();
const windows = O.obj();
const tabs = O.obj();

const defaultRealm = createRealm('Default');
const incoRealm = createRealm('Incognito', 1);

const methods = {
  show: {
    async all(){
      log(O.vals(realms).join('\n'));

      const detachedWins = O.vals(windows).filter(a => a.realm === null);
      const detachedTabs = O.vals(tabs).filter(a => a.window === null);

      if(detachedWins.length !== 0)
        log(detachedWins.join('\n'));

      if(detachedTabs.length !== 0)
        log(detachedTabs.join('\n'));
    },
  },

  async create(tabRaw){
    const {realm, win, tab} = getTabInfo(tabRaw);
  },

  async update(tabId, dif, tabRaw){
    const {realm, win, tab} = getTabInfo(tabRaw);

    if(O.has(dif, 'url'))
      tab.url = dif.url;
  },

  async move(tabId, info){
    const {win, tab} = getTabInfo({
      id: tabId,
      windowId: info.windowId,
      index: info.fromIndex,
    });

    win.moveTab(tab, info.toIndex);
  },

  async detach(tabId, info){
    const winId = info.oldWindowId;

    const {win, tab} = getTabInfo({
      id: tabId,
      windowId: winId,
      index: info.oldPosition
    });

    win.removeTab(tab.id);
    closeWinIfNeeded(win);
  },

  async attach(tabId, info){
    const winId = info.newWindowId;

    const {tab} = getTabInfo({
      id: tabId,
    });

    const {realm} = tab;

    if(!O.has(windows, winId))
      windows[winId] = new Window(winId);

    assert(O.has(windows, winId));
    const win = windows[winId];

    if(win.realm === null && realm !== null)
      realm.addWindow(win);

    win.insertTab(tab, info.newPosition);
  },

  async replace(info){
    O.noimpl('replace');
  },

  async remove(tabId, info){
    const {win, tab} = getTabInfo({
      id: tabId,
      windowId: info.windowId,
    });

    if(tab === null){
      // In this case we cannot determine the index of the closed tab
      // so we stop tracking the entire window

      log(`WARNING: No longer tracking window ${win.id}`)

      for(const tab of win)
        if(tab !== null)
          delete tabs[tab.id];

      if(win.realm !== null)
        win.realm.removeWindow(win.id);

      assert(O.has(windows, win.id));
      delete windows[win.id];

      return;
    }

    win.removeTab(tab.id);
    closeWinIfNeeded(win);

    delete tabs[tab.id];
  },
};

const getTabInfo = info => {
  const realm = getRealm(info);
  const winId = getWinId(info);
  const tabId = getTabId(info);

  assert(typeof tabId === 'number');

  let win = null;
  let tab = null;

  if(O.has(info, 'windowId')){
    if(!O.has(windows, winId)){
      const win = new Window(winId);

      assert(!O.has(windows, winId));
      windows[winId] = win;

      if(realm !== null)
        realm.addWindow(win);
    }

    assert(O.has(windows, winId));
    win = windows[winId];

    if(realm !== null && win.realm === null)
      realm.addWindow(win);
  }

  addTabToWindow: {
    if(!O.has(tabs, tabId)){
      if(!O.has(info, 'index'))
        break addTabToWindow;

      const {index} = info;
      const tab = new Tab(tabId);

      tabs[tabId] = tab;
      win.setTab(tab, index);

      if(O.has(info, 'url'))
        tab.url = info.url;
    }

    tab = tabs[tabId];

    if(win === null)
      win = tab.window;
  }

  return {
    realm,
    win,
    tab,
  };
};

const getRealm = tabRaw => {
  if(!O.has(tabRaw, 'incognito')) return null;
  if(tabRaw.incognito) return incoRealm;
  return defaultRealm;
};

const getWinId = tabRaw => {
  if(!O.has(tabRaw, 'windowId')) return null;
  return tabRaw.windowId;
};

const getTabId = tabRaw => {
  assert(O.has(tabRaw, 'id'));
  return tabRaw.id;
};

function createRealm(...args){
  const realm = new Realm(...args);
  const {name} = realm;

  assert(!O.has(realms, name));
  realms[name] = realm;

  return realm;
}

const closeWinIfNeeded = win => {
  if(win.tabsNum !== 0) return;

  const {realm} = win;

  if(realm !== null)
    realm.removeWindow(win.id);

  assert(O.has(windows, win.id));
  delete windows[win.id];
};

module.exports = methods;