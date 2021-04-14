'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');
const O = require('../omikron');
const strs = require('../strs');
const fsRec = require('../fs-rec');

const VERSION_MAJOR = '1.17';
const VERSION = '21w15a';

const EMPTY_SOUND_HASH = '7f31c0bcfab392513ac53c75ac30f18bfc8d18da';

const cwd = __dirname;
const dataFile = path.join(cwd, 'data.hex');

const mainDir = path.normalize(`C:/Users/Thomas/AppData/Roaming/.${strs.m}`);
const versDir = path.join(mainDir, 'versions');
const verDir = path.join(versDir, VERSION);
const jarFile = path.join(verDir, `${VERSION}.jar`);
const bakFile = path.join(verDir, `${VERSION}.jar.bak`);
const jarDir = path.join(verDir, VERSION);
const jarAssetsDir = path.join(jarDir, `assets/${strs.m}`);
const langFile = path.join(jarAssetsDir, `lang/en_us.json`);
const textsDir = path.join(jarAssetsDir, 'texts');
const assetsDir = path.join(mainDir, 'assets');
const indexesDir = path.join(assetsDir, 'indexes');
const indexesFile = path.join(indexesDir, `${VERSION_MAJOR}.json`);

const texts = [
  'credits',
  'splashes',
  'end',
];

const main = () => {
  if(!fs.existsSync(bakFile)){
    log(`Creating backup file`);
    O.wfs(bakFile, O.rfs(jarFile));
  }

  if(fs.existsSync(jarFile)){
    log(`Deleting the old JAR file`);
    fs.unlinkSync(jarFile);
  }

  log(`Restoring the original JAR file`);
  O.wfs(jarFile, O.rfs(bakFile));

  if(fs.existsSync(jarDir)){
    log(`Deleting the JAR directory`);
    del(jarDir);
  }

  log(`Creating the JAR directory`);
  fs.mkdirSync(jarDir);

  log(`Extracting the JAR archive`);
  cp.spawnSync('jar', ['-xf', jarFile], {
    cwd: jarDir,
  });

  log(`Deleting the original JAR file`);
  fs.unlinkSync(jarFile);

  log(`Deleting the "META-INF" directory`);
  del(path.join(jarDir, 'META-INF'));

  log(`Removing the spam from the title screen`);
  exec(() => {
    log(`Parsing the spam string`);
    const ser = new O.Serializer(O.rfs(dataFile), 1);
    const spamStr = ser.readStr();
    const spamBuf = Buffer.from(spamStr);

    log(`Retrieving the list of all class files`);
    const classFiles = fs.readdirSync(jarDir).filter(file => {
      return file.endsWith('.class');
    });

    log(`Searching for the class file that contains the spam string`);
    const classFile = exec(() => {
      const found = [];

      for(const fileName of classFiles){
        const pth = path.join(jarDir, fileName);
        const buf = O.rfs(pth);

        if(buf.includes(spamBuf)){
          log(`Found: ${O.sf(fileName.replace(/\.class$/, ''))}`);
          found.push(fileName)
        }
      }

      assert(found.length === 1);

      return path.join(jarDir, found[0]);
    });

    log(`Patching the class file`);
    exec(() => {
      log(`Reading the class file`);
      const buf = O.rfs(classFile);

      log(`Searching for the index of the spam string`);
      const index = exec(() => {
        const index = buf.indexOf(spamBuf);

        assert(index !== -1);
        assert(buf.lastIndexOf(spamBuf) === index);

        log(`Index: ${index}`);

        return index;
      });

      log(`Removing the spam string`);
      buf.fill(' ', index, index + spamBuf.length);

      log('Saving the class file');
      O.wfs(classFile, buf);
    });
  });

  log(`Removing the "Modded" string from the lang file`);
  exec(() => {
    log(`Reading the lang file`);
    const obj = JSON.parse(O.rfs(langFile, 1));
    
    log(`Removing the string`);
    const key = 'menu.modded';
    assert(O.has(obj, key));
    obj[key] = '';

    log(`Saving the lang file`);
    O.wfs(langFile, O.sf(obj));
  });

  log(`Removing texts`);
  exec(() => {
    log(`Retrieving the list of all texts`);
    const files = fs.readdirSync(textsDir).filter(file => {
      return file.endsWith('.txt');
    });

    assert(files.length === texts.length);

    log(`Updating texts one at a time`);
    exec(() => {
      for(const text of texts){
        const fileName = `${text}.txt`;
        assert(files.includes(fileName));

        log(`Removing ${O.sf(text)}`);
        exec(() => {
          log(`Reading the text file`);
          const pth = path.join(textsDir, fileName);
          const linesNum = O.sanl(O.rfs(pth, 1)).length;

          log(`Removing the content`);
          const str = '\n'.repeat(linesNum - 1);

          log(`Saving the text file`);
          O.wfs(pth, str);
        });
      }
    });
  });

  log('Removing sounds');
  exec(() => {
    log(`Reading the indexes file`);
    const obj = JSON.parse(O.rfs(indexesFile, 1));

    assert(O.has(obj, 'objects'));
    const objs = obj.objects;
    const allKeys = O.keys(objs);

    log(`Removing the portal sound`);
    exec(() => {
      const key = 'minecraft/sounds/portal/portal.ogg';
      assert(O.has(objs, key));
      objs[key].hash = EMPTY_SOUND_HASH;
    });

    log(`Removing door and chest sounds`);
    exec(() => {
      const keys = allKeys.filter(a => /(?<![a-z0-9])(?:door|chest)(?![a-z0-9])/.test(a));
      assert(keys.length !== 0);

      for(const key of keys)
        objs[key].hash = EMPTY_SOUND_HASH;
    });

    log(`Saving the indexes file`);
    O.wfs(indexesFile, O.sf(obj));
  });

  log(`Compressing into JAR archive`);
  cp.spawnSync('jar', ['cMf', jarFile, '*'], {
    cwd: jarDir,
  });

  log(`Deleting the JAR directory`);
  del(jarDir);

  log(`Done`);
};

const exec = func => {
  log.inc();
  const result = func();
  log.dec();

  return result;
};

const del = dir => {
  assert(dir.startsWith(`${mainDir}\\`));
  new fsRec.Directory(dir).deleteRec();
};

main();