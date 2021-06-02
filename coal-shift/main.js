'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const initDate = [23, 5, 2021];

const main = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const days = daysDif(day, month, year);
  const shift = getShift(days);

  log(`${day}.${month}.${year} - ${shift}`);
};

const getShift = days => {
  return (days >> 1) + 1 & 3;
};

const daysDif = (day, month, year) => {
  const ms = 24 * 60 * 60 * 1e3;
  const d1 = Date.UTC(initDate[2], initDate[1] - 1, initDate[0]);
  const d2 = Date.UTC(year, month - 1, day);

  const days = (d2 - d1) / ms;
  assert(days === (days | 0));

  return days;
};

main();