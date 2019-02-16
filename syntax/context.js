'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

/**
 * This class is used for languages that depend on parametriz context
 * Context is an abstract class and only extended classes should be used
 * Extended classes must implement serializable interface
 */

class Context{
  constructor(){}

  ser(ser=new O.Serializer()){ O.virtual('ser'); }
  static deser(ser){ O.virtual('deser'); }
};

module.exports = Context;