'use strict';

const assert = require('assert');
const O = require('../omikron');
const util = require('./util');
const su = require('./str-util');

class Base{
  static *deser(ser){ O.virtual('deser', 1); }

  *ser(ser=new O.serializer()){ O.virtual('ser'); }
}

module.exports = Base;