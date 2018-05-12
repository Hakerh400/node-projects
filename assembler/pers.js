'use strict';

var pers = [
  'mboard',
  'timer',
  'input',
  'output',
].map(perName => {
  var perCtor = require(`./pers/${perName}.js`);
  var per = new perCtor();

  return per;
});

module.exports = pers;