'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const frequencies = require('./frequencies.json');

const w = 44100;

const defaultNoteNum = 4;
const noteDuration = w / 4;
const pauseFactor = .5;

const volume = 1;

const freqOffset = 50;
const freqArr = getFreqArr();

module.exports = {
  render,
};

function getFreqArr(){
  return O.keys(frequencies).sort((a, b) => {
    a = frequencies[a];
    b = frequencies[b];
    return (a > b) - (a < b);
  });
}

function render(notesFile, audioFile, cb=O.nop){
  var notes = loadNotes(notesFile);
  var framesNum = Math.ceil(notes.time / w);

  var s1 = Math.PI * 2 / w;
  var lastNoteIndex = 0;

  media.renderAudio(audioFile, w, (w, d, f) => {
    media.logStatus(f, framesNum);
    f--;

    for(var i = 0; i !== w; i++){
      var sample = f * w + i;

      var v = 0;
      var vt = 0;

      for(var j = lastNoteIndex; j !== notes.length; j++){
        v += vt * volume;
        vt = 0;

        var [freq, start, end] = notes[j];
        if(sample < start) break;

        vt = Math.sin((sample - start) * s1 * freq);
        if(sample < end) continue;

        vt *= Math.exp((end - sample) / 100);
        if(sample < end + w) continue;

        lastNoteIndex++;
      }

      v += vt * volume;

      d.writeFloatLE(v, i << 2);
    }

    return ++f != framesNum;
  }, cb);
}

function loadNotes(file){
  var notes = fs.readFileSync(file).toString();
  var time = 0;

  notes = notes.replace(/[^a-z0-9\#\d\.\- ]/gi, ' ').replace(/\s+/g, ' ').match(/\S+ \S+ \S+/g).map((line, index) => {
    var [note, duration, pause] = line.split(' ');

    note = note.toUpperCase();
    if(!/\d/.test(note)) note += defaultNoteNum;
    else if(/^\d+$/.test(note)) note = freqArr[Number(note) + freqOffset];
    if(!(note in frequencies)) throw new SyntaxError(`Unrecognized note "${note}".`);

    duration = Number(duration) * noteDuration;
    pause = Number(pause) * noteDuration;

    var factor = noteDuration * pauseFactor;
    var factorh = factor / 2;
    duration -= factor;

    time += factorh;

    var freq = frequencies[note];
    var start = time;
    var end = time += duration;

    time += factorh + pause;

    return [freq, start, end];
  });

  notes.time = time;

  return notes;
}