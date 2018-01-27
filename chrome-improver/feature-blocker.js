'use strict';

var profileBlocker = require('./profile-blocker.js');
var messageBlocker = require('./message-blocker.js');
var asyncFuncs = require('./async-funcs.js');
var O = require('../framework');
var debug = require('./debug.js');
var nop = require('./nop.js');

var attemptsNum = 3;

module.exports = {
  blockOrUnblock
};

function blockOrUnblock(feature, block = true, cb = nop){
  var blockOriginal = block;
  
  block = block ? 'block' : 'unblock';

  var blockStr = `${capitalize(block)}ing feature "${feature}".`;
  if(feature == 'all') blockStr = `${capitalize(block)}ing all features.`;

  switch(feature){
    case 'thumbnails': case 'flash':
      logBlockStr();
      attemptMultipleTimes(profileBlocker[feature][block], attemptsNum, cb);
      break;

    case 'messages':
      logBlockStr();
      attemptMultipleTimes(messageBlocker[block], attemptsNum, cb);
      break;

    case 'all':
      logBlockStr();
      debug.incIndent();
      blockAllFeatures(blockOriginal, cb);
      break;

    default:
      cb('Unknown feature.');
      break;
  }

  function logBlockStr(){
    debug.decIndent();
    debug.log(blockStr);
    debug.incIndent();
  }
}

function blockAllFeatures(block = true, cb = nop){
  var features = [
    'thumbnails',
    'flash',
    'messages'
  ];

  var funcs = O.ca(features.length, () => blockOneFeature);

  asyncFuncs.exec(funcs, [], err => {
    debug.decIndent();
    cb(err);
  });

  function blockOneFeature(cb){
    var feature = features.shift();

    blockOrUnblock(feature, block, cb);
  }
}

function attemptMultipleTimes(func, attemptsNum, cb){
  var attempt = 1;

  logAttempt(attempt, attemptsNum);
  debug.incIndent();
  func(attemptFunc);

  function attemptFunc(err){
    debug.decIndent();

    if(err){
      if(attempt < attemptsNum){
        debug.err(err);
        
        attempt++;
        logAttempt(attempt, attemptsNum);
        debug.incIndent();
        func(attemptFunc);
      }else{
        cb(err);
      }

      return;
    }

    cb();
  }
}

function logAttempt(attempt, attemptsNum){
  debug.log(`Attempt ${attempt} of ${attemptsNum}.`);
}

function capitalize(str){
  return str[0].toUpperCase() + str.substring(1);
}