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

      updateInfo: {
        if(O.has(filesObj, file)){
          filesObj[file].tags = tags;
          break updateInfo
        }

        const info = {file, tags};

        tagsInfo.push(info);
        filesObj[file] = info;
      }

      O.wfs(tagsFile, O.sf(tagsInfo));
    },

    async search(tags){
      return O.sortAsc(tagsInfo.filter(info => {
        return tags.every(tag => info.tags.includes(tag));
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

  if(sortFunc){
    matches.sort((a, b) => {
      if(a.toLowerCase() === lower) return -1;
      if(b.toLowerCase() === lower) return 1;
      return sortFunc(a, b);
    });
  }

  return matches;
};

const defaultSortFunc = (a, b) => {
  if(a < b) return -1;
  if(a > b) return 1;
  return 0;
};

module.exports = methods;