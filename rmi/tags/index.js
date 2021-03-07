'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../omikron');
const rmi = require('..');
const tagsDir = require('./dir');

const tagsFile = path.join(tagsDir, 'tags.txt');

if(!fs.existsSync(tagsFile))
  O.wfs(tagsFile, '');

const tagsArr = O.sanl(O.rfs(tagsFile, 1));
const tagsObj = O.arr2obj(tagsArr);

const methods = {
  tag: {
    async search(substr){
      const lower = substr.toLowerCase();

      return tagsArr.filter(tag => {
        return tag.toLowerCase().includes(lower);
      });
    },
  },
};

module.exports = methods;