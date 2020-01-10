'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const O = require('../omikron');
const port = require('./port');

const main = () => {
  http.get(`http://localhost:${port}/`, O.nop);
};

main();