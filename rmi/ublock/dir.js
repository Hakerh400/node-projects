'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../omikron');
const rmi = require('..');

const dir = path.join(rmi.mainDir, 'ublock');

module.exports = dir;