'use strict';

const fs = require('fs');
const path = require('path');
const esolangs = require('../../../esolangs');
const O = require('../../omikron');
const arrOrder = require('../../arr-order');
const logStatus = require('../../log-status');
const codeGen = require('./code-gen');

const LANG = 'Meadow';

const sandbox = new esolangs.Sandbox();

const main = async () => {
  const src = codeGen();

  log(src);

  sandbox.dispose();
};

main().catch(O.error);