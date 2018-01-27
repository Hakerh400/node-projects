'use strict';

var readline = require('readline');
var featureBlocker = require('./feature-blocker.js');
var debug = require('./debug.js');
var nop = require('./nop.js');

var commands = [
  ['help', [], 'Display this message.'],

  ['(un)block', [
    'thumbnails',
    'flash',
    'messages',
    'all'
  ], '(Un)block Chrome features.'],

  ['exit', [], 'Close the program.']
];

var rl = null;

module.exports = {
  create
};

function create(cb = nop){
  debug.init(err => {
    if(err){
      return cb(err);
    }

    debug.info('Creating user interface.');

    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    var paused = false;

    debug.log('> ', false);

    rl.on('line', input => {
      var inputOriginal = input;

      debug.info(`User input: ${inputOriginal}`);

      if(paused){
        debug.info('User input is not processed because the interface is paused.');
        return;
      }

      input = input.replace(/\s+/g, ' ');
      input = input.trim();
      input = input.split` `;

      switch(input[0].toLowerCase()){
        case '':
          debug.info('Empty line.');
          debug.log(`> `, false);
          break;

        case 'help': case '?':
          debug.info('User requested help message.');
          debug.log('');
          displayHelp();
          debug.log(`\n> `, false);
          break;

        case 'block': case 'unblock':
          debug.log('');
          pause();
          debug.incIndent();
          blockOrUnblockFeature(input[0], input[1], err => {
            debug.decIndent();
            resume(err);
          });
          break;

        case 'exit':
          debug.info('Preparing to close the process.');
          exit();
          break;

        default:
          debug.log('');
          debug.err('Unknown command.');
          debug.log(`\n> `, false);
          break;
      }
    });

    cb();

    function pause(){
      debug.info('Pausing the interface.');
      paused = true;
    }

    function resume(err){
      if(err){
        debug.err(err);
      }else{
        debug.log('Success.');
      }

      debug.info('Resuming the interface.');
      paused = false;
      debug.log(`\n> `, false);
    }
  });
}

function blockOrUnblockFeature(type = '', feature = '', cb = nop){
  type = type.toLowerCase();
  feature = feature.toLowerCase();

  type = [
    'block',
    'unblock'
  ].indexOf(type);

  if(type == -1){
    return cb('Unknown command.');
  }

  type = [true, false][type];

  featureBlocker.blockOrUnblock(feature, type, cb);
}

function displayHelp(){
  var str = getUsageHelp(commands);

  debug.log(str);
}

function getUsageHelp(commands){
  var usageStr = 'Usage:';
  var commandsStr = debug.indentStr(formatCommands(commands), 1);
  var str = `${usageStr}\n${commandsStr}`;

  return str;
}

function formatCommands(commands){
  var str = commands.map(([command, args, description]) => {
    var argsStr = formatArgs(args);
    var argsSpace = argsStr ? ' ' : '';

    return `${command}${argsSpace}${argsStr} - ${description}`;
  }).join`\n`;

  return str;
}

function formatArgs(args){
  if(!args.length) return '';

  return `[${args.join` | `}]`;
}

function exit(){
  debug.exit();
  rl.close();
}