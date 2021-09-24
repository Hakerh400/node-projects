'use strict';

const assert = require('./assert');
const O = require('../omikron');
const Base = require('./base');
const util = require('./util');
const su = require('./str-util');

class EventTarget extends Base{
  emit(type, ...args){
    this[type](...args);
  }
}

module.exports = EventTarget;