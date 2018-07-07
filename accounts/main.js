'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const passGen = require('./passgen.js');

const accsDir = path.join(O.dirs.projects, 'accounts');
const accsFile = path.join(accsDir, 'main.json');

const PASS_LEN_INTVAL = [10, 20];

setTimeout(main);

function main(){
  var accs = loadAccs();
  var accsNew = processAccs(accs);
  saveAccs(accsNew);
}

function loadAccs(){
  inc('Searching for accounts JSON file');

  if(!fs.existsSync(accsFile)){
    log('Creating new file');

    try{ fs.writeFileSync(accsFile, '[]'); }
    catch(e){ err('Unable to create file', e); }
  }

  log('Loading the content');
  var json = fs.readFileSync(accsFile, 'utf8');

  log('Parsing the loaded content as JSON');
  try{ var accs = JSON.parse(json); }
  catch(e){ err('There is a syntax error in the JSON file', e); }

  checkType(accs, 'array');

  dec(`Found ${accs.length} accounts`);

  return accs;
}

function processAccs(accs){
  inc('Processing accounts');

  var updatedAccs = 0;

  var accsNew = accs.map((acc, index) => {
    checkType(acc, 'object');

    var nick = getProp(acc, 'nick', `Account ${index + 1}`);
    inc(`Processing account "${nick}"`);
    acc.nick = nick;

    var updated = false;

    if(missing(acc, 'pass')){
      inc('Generating password');

      var pass = genPass();
      log(`Generated a password of length ${pass.length} characters`);

      log('Assigning the password to the account');
      acc.pass = pass;

      dec();
      updated = true;
    }

    if(updated){
      dec();
      updatedAccs++;
    }else{
      dec('No updates');
    }

    return acc;
  });

  dec(`Updated ${updatedAccs} accounts`);

  return accsNew;
}

function saveAccs(accs){
  inc('Saving accounts');

  log('Stringifying accounts into JSON');
  var json = JSON.stringify(accs, null, 2);

  log('Writing to the file');
  fs.writeFileSync(accsFile, json);

  dec('Success');
}

function genPass(){
  var len = genPassLen();
  var pass = passGen.gen(len);

  return pass;
}

function genPassLen(){
  var [min, max] = PASS_LEN_INTVAL;
  var len = min + O.rand(max - min + 1);

  return len;
}

function getProp(obj, prop, def){
  if(!has(obj, prop)){
    log(`${prop} ---> "${def}"`);
    return def;
  }

  var val = obj[prop];
  var type = getType(val);

  if(type === 'object' || type === 'array')
    checkType(val, 'string');

  if(type !== 'string')
    val = String(val);

  return val;
}

function checkType(val, type){
  var t = getType(val);
  if(t !== type)
    err(`Expected ${type}, but got ${t}`);
}

function getType(val){
  if(val === null) return 'null';
  if(Array.isArray(val)) return 'array';
  if(typeof val === 'boolean') return String(val);
  return typeof val;
}

function has(obj, prop){
  if(!obj.hasOwnProperty(prop)) return false;
  if(obj[prop] === null) return false;
  return true;
}

function missing(obj, prop){
  return !has(obj, prop);
}

function err(msg, e=null){
  var delimiter = a => `\n${'='.repeat(120)}${a ? '\n' : ''}`;

  log.set(0);
  log(delimiter(1));
  log(msg);
  if(e !== null) log(e.message);
  log(delimiter(0))

  throw 'aborting';
}

function inc(msg=null){
  if(msg !== null) log(msg);
  log.inc();
}

function dec(msg=null){
  if(msg !== null) log(msg);
  log.dec();
  if(log.get() === 0) log('');
}