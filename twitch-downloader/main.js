'use strict';

var twitch = require('.');

var user = 'ilmango';
var file = '-dw/1.ts';

setTimeout(main);

function main(){
  twitch.download(user, file);
}