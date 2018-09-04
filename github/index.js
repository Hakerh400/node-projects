'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../framework');
const fsRec = require('../fs-recursive');
const encryptor = require('../encryptor');
const minifier = require('../minifier');
const tempDir = require('../temp-dir')(__filename);

const repos = require('./repos.json');
const noCopyList = require('./no-copy-list.json');
const skipList = require('./skip-list.json');
const supportedExts = require('./supported-exts.json');
const textExts = require('./text-exts.json');
