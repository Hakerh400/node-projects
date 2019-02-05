'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const vi = require('./addon/build/Release/addon.node');
const keyCodes = require('./key-codes.json');

vi.comb = (key1, key2) => {
  vi.kdown(key1);
  vi.key(key2);
  vi.kup(key1);
};

vi.shift = key => {
  vi.comb(0x10, key);
};

vi.ctrl = key => {
  vi.comb(0x11, key);
};

vi.char = c => {
  const k = vi.key;
  const s = vi.shift;
  const cc = O.cc(c);

  if(c === '\n') return k(0x0D);

  if(/[0-9]/.test(c)) return k(cc);
  if(/[A-Z]/.test(c)) return s(cc);
  if(/[a-z]/.test(c)) return k(cc - 32);

  if(keyCodes.hasOwnProperty(c)){
    const [code, shift] = keyCodes[c];
    (shift ? s : k)(code);
    return;
  }

  const i = ')!@#$%^&*('.indexOf(c);
  if(i !== -1) return s(i + 48);

  log(JSON.stringify(c));
};

vi.str = str => {
  str = str.replace(/\r\n|\r|\n/g, '\n');

  for(const char of str)
    vi.char(char);
};

vi.dir = dir => {
  vi.key([0x26, 0x27, 0x28, 0x25][dir]);
};

vi.nav = dir => {
  vi.dir(dir);
};

vi.code = async (str, lang=null, tMin=20, tMax=120) => {
  str = str
    .replace(/\r\n|\r|\n/g, '\n')
    .replace(/\n\s+/g, '\n');

  switch(lang){
    case 'html':
      str = str.replace(/\/[a-z0-9]+>/g, '/\x00\x00');
      break;
  }

  const scopes = [];
  let prev = null;
  let c;

  for(c of str){
    if(prev === '\x00'){
      const cc = O.cc(c);

      switch(cc){
        case 0x00: vi.key(0x1B); break; // Escape

        default:
          throw new TypeError(`Unsupported instruction 0x${String(cc).padStart(2, '0')}`);
          break;
      }

      prev = null;
      continue;
    }

    if(c === '\x00'){
      prev = c;
      continue;
    }

    if(prev !== '\\'){
      if(/[\(\[\{]/.test(c)) push();
      else if(/\)\]\}/.test(c)) pop();
      else if(/'"`/.test(c)) O.last(scopes) !== c ? push() : pop();
      else vi.char(c);
    }else{
      vi.char(c);
    }

    await O.waita(O.rand(tMin, tMax));

    prev = c;
  }

  vi.key(0x1B); // Escape
  vi.ctrl(0x53); // Ctrl + S

  function push(){
    vi.char(c);
    scopes.push(c);
  }

  function pop(){
    vi.nav(1);
    scopes.pop();
  }
};

module.exports = vi;