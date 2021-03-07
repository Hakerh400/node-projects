'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../omikron');
const rmi = require('..');
const tagsDir = require('./dir');

const tagsFile = path.join(tagsDir, 'tags.json');

if(!fs.existsSync(tagsFile))
  O.wfs(tagsFile, '[]');

const tagsInfo = JSON.parse(O.rfs(tagsFile, 1));

const tagsArr = [];
const tagsObj = O.obj();
const filesObj = O.obj();

const addTag = tag => {
  if(!O.has(tagsObj, tag)){
    tagsArr.push(tag);
    tagsObj[tag] = 1;
    return;
  }

  tagsObj[tag]++;
};

const addTags = tags => {
  for(const tag of tags)
    addTag(tag);
};

for(const info of tagsInfo){
  const {file, tags} = info;

  addTags(tags);
  filesObj[file] = info;
}

process.on('exit', () => {
  O.wfs(tagsFile, O.sf(tagsInfo));
});

const methods = {
  tag: {
    async search(substr){
      return findMatches(tagsArr, substr, (a, b) => {
        return tagsObj[b] - tagsObj[a];
      });
    },
  },

  file: {
    async getTags(file){
      if(!O.has(filesObj, file))
        return null;

      return filesObj[file].tags;
    },

    async setTags(file, tags){
      tags = O.undupe(tags);

      addTags(tags);

      if(!O.has(filesObj, file)){
        const info = {file, tags};

        tagsInfo.push(info);
        filesObj[file] = info;

        return;
      }

      filesObj[file].tags = tags;
    },

    async search(tags){
      const tagsObj = O.obj();

      for(const tag of tags)
        tagsObj[tag] = 1;

      return O.sortAsc(tagsInfo.filter(info => {
        return info.tags.every(tag => tag in tagsObj);
      }).map(a => a.file));
    },
  },

  fs: {
    async readdir(pth){
      if(pth.endsWith('/'))
        return fs.readdirSync(pth);

      const parent = path.join(pth, '..');
      const base = path.parse(pth).base;
      const items = fs.readdirSync(parent);

      items.unshift('..');

      return findMatches(items, base);
    },
  },
};

const findMatches = (arr, substr, sortFunc=defaultSortFunc) => {
  const lower = substr.toLowerCase();

  const matches = arr.filter(tag => {
    return tag.toLowerCase().includes(lower);
  });

  if(sortFunc)
    matches.sort(sortFunc);

  return matches;
};

const defaultSortFunc = (a, b) => {
  if(a < b) return -1;
  if(a > b) return 1;
  return 0;
};

module.exports = methods;