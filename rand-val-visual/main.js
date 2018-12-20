'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const util = require('util');
const O = require('../omikron');
const media = require('../media');
const Presentation = require('../presentation');
const VisualConsole = require('../visual-console');
const randVal = require('../rand-val');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const outputFile = getOutputFile();

const valsNum = 1e5;
const filterProb = .1;

const start = 0;
const prob = .9;

const blackList = [
  Boolean,
  Number,
  String,
  Date,
  BigInt,
  ArrayBuffer,
];

setTimeout(() => main().catch(log));

async function main(){
  var img = await VisualConsole.getCharsImg();
  var pr = new Presentation(w, h, fps, fast);

  pr.verbose = 0;

  pr.render(outputFile, async (w, h, g, g1) => {
    var vcon = new VisualConsole(g, img, 8, 12, 'black', 'darkgray');
    await pr.frame();

    await O.repeata(valsNum, async valIndex => {
      media.logStatus(valIndex + 1, valsNum, 'value');

      var filterEnabled = O.randf(1) < filterProb;

      do{
        var val = randVal(start, prob);
        try{
          if(!blackList.includes(val.constructor)) break;
        }catch{}
      }while(filterEnabled);

      var str = util.inspect(val);
      await print(str);
    });

    async function print(str, newLine=1){
      for(var char of str){
        vcon.printChar(char);
        await pr.frame();
      }

      if(newLine)
        vcon.newLine();
    }
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}