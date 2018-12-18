'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const O = require('../framework');
const fsRec = require('../fs-recursive');
const getTempDir = require('../temp-dir').bind(null, __filename);

const REMOVE_INVALID = 1;

const CWD = __dirname;
const PACKAGES_DIR = 'C:/Program Files/Sublime Text 3/Packages';
const LOCAL_REPO = path.join(CWD, 'GIT\x5fEXCLUDE/st-merge');

const langAliases = {
  'js': 'javascript',
};

setTimeout(() => main().catch(log));

async function main(){
  var args = [...process.argv].slice(2);
  if(args.length !== 1) err('Expected 1 argument');

  var lang = parseLangName(args[0]);
  if(lang === null) err('Unknown language name');

  var dir = await copyFiles(lang);
  if(REMOVE_INVALID) await removeInvalid(dir);

  var zip = await zipFiles(dir);
  await copyZippedFile(zip, lang);
}

function parseLangName(lang){
  lang = lang.trim().toLowerCase();

  if(langAliases.hasOwnProperty(lang))
    lang = langAliases[lang];

  var langs = fs.readdirSync(LOCAL_REPO).filter(a => !a.includes('.'));
  var index = langs.findIndex(a => a.toLowerCase() === lang);
  if(index === -1) return null;

  return langs[index];
}

function copyFiles(lang){
  var dir1 = path.join(LOCAL_REPO, lang);
  var dir2 = getTempDir();

  fsRec.copyFilesSync(dir1, dir2);

  return dir2;
}

function removeInvalid(dir){
  fsRec.processFilesSync(dir, d => {
    if(d.isDir) return;
    if(!d.name.endsWith('.sublime-syntax')) return;

    var str = fs.readFileSync(d.fullPath, 'utf8');
    str = str.replace(/invalid\./g, 'invalid1.');
    fs.writeFileSync(d.fullPath, str);
  });
}

function zipFiles(dir){
  return new Promise((res, rej) => {
    var zipFile = path.join(getTempDir(), '1.zip');
    var stream = fs.createWriteStream(zipFile);

    var archive = archiver('zip');
    archive.pipe(stream);

    stream.on('close', () => res(zipFile));
    archive.on('error', rej);

    archive.directory(dir, false);
    archive.finalize();
  });
}

function copyZippedFile(file, lang){
  var data = fs.readFileSync(file);
  var dest = path.join(PACKAGES_DIR, `${lang}.sublime-package`);
  fs.writeFileSync(dest, data);
}

function err(msg){
  log(`ERROR: ${msg}`);
  O.proc.exit(1);
}