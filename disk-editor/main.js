'use strict';

var fs = require('fs');
var O = require('../framework');
var media = require('../media');
var formatFileName = require('../format-file-name');
var diskEditor = require('.');

setTimeout(main);

function main(){
  var disk = diskEditor.open('C');

  media.custom('', '', '-img/1.png', f => {
    if(f > 3e3) return;

    console.log(f);

    return disk.read(76921464 + f - 1);
  }, () => {
    disk.close();
  });
}