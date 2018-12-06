'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const HopfieldMemory = require('.');

const w = 10;
const h = 12;
const s = 40;

const PAT_0 = ' ';
const PAT_1 = '#';
const COL_0 = '#fff';
const COL_1 = '#f00';

const cwd = __dirname;
const patsFile = path.join(cwd, 'patterns.txt');
const testPatFile = path.join(cwd, 'test-pattern.txt');

setTimeout(main);

function main(){
  var pats = parsePats(fs.readFileSync(patsFile, 'utf8'));
  var testPat = parsePat(fs.readFileSync(testPatFile, 'utf8'));

  var mem = new HopfieldMemory(pats);
  var output = mem.match(testPat);

  media.renderImage('-img/1.png', w * s, h * s, (ws, hs, g) => {
    g.fillStyle = COL_0;
    g.fillRect(0, 0, ws, hs);

    g.fillStyle = COL_1;
    for(var y = 0; y !== h; y++){
      for(var x = 0; x !== w; x++){
        var i = x + y * w;
        if(!output[i]) continue;
        g.fillRect(x * s, y * s, s, s);
      }
    }
  });
}

function parsePats(str){
  return str.split(/\-+[\r\n]*/).map(str => parsePat(str));
}

function parsePat(str){
  var pat = O.ca(w * h, () => 0);

  O.sanl(str).forEach((line, y) => {
    for(var x = 0; x !== line.length; x++){
      var c = line[x];
      if(c === PAT_0) continue;
      if(c !== PAT_1) throw new TypeError('Invalid character');

      var i = x + y * w;
      pat[i] = 1;
    }
  });

  return pat;
}